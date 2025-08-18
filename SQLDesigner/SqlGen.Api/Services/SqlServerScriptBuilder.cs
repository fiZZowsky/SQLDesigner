using SqlDesigner.Api.Domain;
using SqlGen.Api.Domain.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace SqlDesigner.Api.Services;

public class SqlServerScriptBuilder : ISqlScriptBuilder
{
    public string BuildProjectScript(Project project)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"-- SQL generated for project: {project.Name}");
        sb.AppendLine($"-- Generated at: {DateTime.UtcNow:O}");
        sb.AppendLine("SET ANSI_NULLS ON;");
        sb.AppendLine("SET QUOTED_IDENTIFIER ON;");
        sb.AppendLine();

        // Schemas
        var schemas = project.Tables.Select(t => t.Schema).Distinct(StringComparer.OrdinalIgnoreCase);
        foreach (var schema in schemas)
        {
            if (!string.Equals(schema, "dbo", StringComparison.OrdinalIgnoreCase))
            {
                sb.AppendLine($@"IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'{schema}')
    EXEC('CREATE SCHEMA [{schema}]');");
                sb.AppendLine();
            }
        }

        // Tables + columns + PK + column-level UNIQUE + CHECK/UNIQUE constraints
        foreach (var t in project.Tables)
        {
            var fullName = $"[{t.Schema}].[{t.Name}]";
            sb.AppendLine($"-- Table {fullName}");
            sb.AppendLine($"IF OBJECT_ID(N'{fullName}', N'U') IS NOT NULL DROP TABLE {fullName};");
            sb.AppendLine("GO");
            sb.AppendLine();

            sb.AppendLine($"CREATE TABLE {fullName}");
            sb.AppendLine("(");

            var columnLines = new List<string>();
            foreach (var c in t.Columns.OrderBy(c => c.Id))
            {
                var line = new StringBuilder();
                line.Append($"    [{c.Name}] {BuildColumnType(c)}");

                if (c.IsIdentity)
                    line.Append($" IDENTITY({c.IdentitySeed},{c.IdentityIncrement})");

                line.Append(c.IsNullable ? " NULL" : " NOT NULL");

                if (!string.IsNullOrWhiteSpace(c.DefaultSql) && c.DefaultKind != SqlDefaultKind.None)
                {
                    var defaultExpr = c.DefaultKind == SqlDefaultKind.Literal
                        ? WrapLiteral(c.DefaultSql!)
                        : c.DefaultSql!;
                    line.Append($" CONSTRAINT [DF_{t.Name}_{c.Name}] DEFAULT ({defaultExpr})");
                }

                if (c.IsUnique && !c.IsPrimaryKey)
                {
                    line.Append($" CONSTRAINT [UQ_{t.Name}_{c.Name}] UNIQUE");
                }

                columnLines.Add(line.ToString());
            }

            // Primary Key (może być wielokolumnowy)
            var pkCols = t.Columns.Where(c => c.IsPrimaryKey)
                                  .OrderBy(c => c.PrimaryKeyOrder ?? int.MaxValue)
                                  .Select(c => $"[{c.Name}] ASC")
                                  .ToList();

            if (pkCols.Any())
            {
                var pkName = string.IsNullOrWhiteSpace(t.PrimaryKeyName)
                    ? $"PK_{t.Name}"
                    : t.PrimaryKeyName!;
                columnLines.Add($"    CONSTRAINT [{pkName}] PRIMARY KEY ({string.Join(", ", pkCols)})");
            }

            // Check constraints (tabelowe)
            foreach (var cc in t.CheckConstraints)
            {
                var ccName = string.IsNullOrWhiteSpace(cc.Name) ? $"CK_{t.Name}_{Math.Abs(cc.Expression.GetHashCode())}" : cc.Name!;
                columnLines.Add($"    CONSTRAINT [{ccName}] CHECK ({cc.Expression})");
            }

            // Unique constraints (wielokolumnowe)
            foreach (var uc in t.UniqueConstraints)
            {
                var ucName = string.IsNullOrWhiteSpace(uc.Name) ? $"UQ_{t.Name}_{Math.Abs(uc.ColumnsCsv.GetHashCode())}" : uc.Name!;
                var cols = string.Join(", ", uc.ColumnsCsv
                    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Select(c => $"[{c}]"));
                columnLines.Add($"    CONSTRAINT [{ucName}] UNIQUE ({cols})");
            }

            sb.AppendLine(string.Join(",\n", columnLines));
            sb.AppendLine(");");
            sb.AppendLine("GO");
            sb.AppendLine();
        }

        // Foreign Keys po CREATE TABLE
        foreach (var t in project.Tables)
        {
            foreach (var fk in t.ForeignKeys)
            {
                var fkName = string.IsNullOrWhiteSpace(fk.Name)
                    ? $"FK_{t.Name}_{fk.RefTable}_{Guid.NewGuid():N}".Substring(0, 20)
                    : fk.Name!;

                var columns = string.Join(", ", fk.Columns.Select(c => $"[{c.ColumnName}]"));
                var refColumns = string.Join(", ", fk.Columns.Select(c => $"[{c.RefColumnName}]"));

                var onDelete = !string.IsNullOrWhiteSpace(fk.OnDeleteAction) ? $" ON DELETE {fk.OnDeleteAction}" : string.Empty;

                sb.AppendLine($"ALTER TABLE [{t.Schema}].[{t.Name}] ADD CONSTRAINT [{fkName}]");
                sb.AppendLine($"    FOREIGN KEY ({columns}) REFERENCES [{fk.RefSchema}].[{fk.RefTable}] ({refColumns}){onDelete};");
                sb.AppendLine("GO");
                sb.AppendLine();
            }
        }

        // Indexes
        foreach (var t in project.Tables)
        {
            foreach (var idx in t.Indexes)
            {
                var defaultIxName = $"IX_{t.Name}_{string.Join("_", idx.Columns.Select(c => c.ColumnName))}";
                var name = string.IsNullOrWhiteSpace(idx.Name) ? defaultIxName : idx.Name!;
                var unique = idx.IsUnique ? "UNIQUE " : string.Empty;

                var cols = string.Join(", ", idx.Columns.Select(c => $"[{c.ColumnName}] {(c.Descending ? "DESC" : "ASC")}"));
                var include = !string.IsNullOrWhiteSpace(idx.IncludeColumnsCsv)
                    ? $" INCLUDE ({string.Join(", ", idx.IncludeColumnsCsv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).Select(c => $"[{c}]"))})"
                    : string.Empty;

                sb.AppendLine($"CREATE {unique}INDEX [{name}] ON [{t.Schema}].[{t.Name}] ({cols}){include};");
                sb.AppendLine("GO");
                sb.AppendLine();
            }
        }

        return sb.ToString();
    }

    private static string BuildColumnType(Column c)
    {
        var dt = (c.DataType ?? string.Empty).Trim().ToLowerInvariant();

        bool HasLen(string s) => s is "varchar" or "nvarchar" or "char" or "nchar" or "varbinary";
        bool HasPrecScale(string s) => s is "decimal" or "numeric";

        // Typy o długości
        if (HasLen(dt))
        {
            string len;

            if (c.Length == null)
            {
                // sensowny default: MAX dla (var) i 50 dla stałej długości
                len = (dt is "varchar" or "nvarchar" or "varbinary") ? "max" : "50";
            }
            else if (c.Length <= 0)
            {
                len = "max";
            }
            else if ((dt is "varchar" or "varbinary") && c.Length > 8000)
            {
                len = "max";
            }
            else if (dt is "nvarchar" && c.Length > 4000)
            {
                len = "max";
            }
            else
            {
                len = c.Length.Value.ToString();
            }

            // char/nchar nie wspiera MAX
            if ((dt is "char" or "nchar") && string.Equals(len, "max", StringComparison.OrdinalIgnoreCase))
                len = "1";

            return $"{dt}({len})";
        }

        // Typy z precision/scale
        if (HasPrecScale(dt))
        {
            var prec = (c.Precision is >= 1 and <= 38) ? c.Precision!.Value : 18;
            var scale = (c.Scale is >= 0 && c.Scale <= prec) ? c.Scale!.Value : Math.Min(prec, 2);
            return $"{dt}({prec},{scale})";
        }

        // Pozostałe znane typy
        if (dt is "datetime" or "smalldatetime" or "date" or "time" or "datetime2" or "datetimeoffset" or "bit" or "int" or "bigint" or "smallint" or "tinyint" or "uniqueidentifier" or "text" or "ntext" or "image" or "float" or "real" or "money" or "smallmoney" or "xml" or "geography" or "geometry")
        {
            return dt;
        }

        // fallback – pozwól na custom typy (np. UDT)
        return c.DataType;
    }

    private static string WrapLiteral(string value)
    {
        // Jeśli value wygląda jak liczba lub funkcja, zostaw jak jest; jeśli nie – otocz w apostrofy i ucieknij
        if (decimal.TryParse(value, out _)) return value;
        if (value.StartsWith("(") && value.EndsWith(")")) return value;
        if (value.Equals("GETDATE()", StringComparison.OrdinalIgnoreCase)) return value;
        if (value.Equals("NEWID()", StringComparison.OrdinalIgnoreCase)) return value;

        var escaped = value.Replace("'", "''");
        return $"'{escaped}'";
    }
}
