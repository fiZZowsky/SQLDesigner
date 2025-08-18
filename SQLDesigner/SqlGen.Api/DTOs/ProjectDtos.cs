using System.ComponentModel.DataAnnotations;
using SqlDesigner.Api.Domain;

namespace SqlDesigner.Api.DTOs;

public record ProjectListItemDto(int Id, string Name, int TablesCount);
public record IdResponse(int Id);

public class ProjectUpsertDto
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public List<TableDto> Tables { get; set; } = new();
}

public class TableDto
{
    public string Schema { get; set; } = "dbo";
    [Required, MaxLength(200)]
    public string Name { get; set; } = default!;
    public string? PrimaryKeyName { get; set; }

    public List<ColumnDto> Columns { get; set; } = new();
    public List<ForeignKeyDto> ForeignKeys { get; set; } = new();
    public List<IndexDto> Indexes { get; set; } = new();
    public List<CheckConstraintDto> CheckConstraints { get; set; } = new();
    public List<UniqueConstraintDto> UniqueConstraints { get; set; } = new();
}

public class ColumnDto
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = default!;

    [Required, MaxLength(128)]
    public string DataType { get; set; } = default!;
    public int? Length { get; set; }
    public int? Precision { get; set; }
    public int? Scale { get; set; }

    public bool IsNullable { get; set; }
    public bool IsPrimaryKey { get; set; }
    public int? PrimaryKeyOrder { get; set; }

    public bool IsIdentity { get; set; }
    public int IdentitySeed { get; set; } = 1;
    public int IdentityIncrement { get; set; } = 1;

    public string? DefaultSql { get; set; }
    public SqlDefaultKind DefaultKind { get; set; } = SqlDefaultKind.None;

    public bool IsUnique { get; set; }
}

public class ForeignKeyDto
{
    public string? Name { get; set; }
    [Required] public string RefSchema { get; set; } = "dbo";
    [Required] public string RefTable { get; set; } = default!;
    public string? OnDeleteAction { get; set; } // "NO ACTION" | "CASCADE" | "SET NULL" | "SET DEFAULT"

    public List<ForeignKeyColumnDto> Columns { get; set; } = new();
}

public class ForeignKeyColumnDto
{
    [Required] public string ColumnName { get; set; } = default!;
    [Required] public string RefColumnName { get; set; } = default!;
}

public class IndexDto
{
    public string? Name { get; set; }
    public bool IsUnique { get; set; }
    public List<IndexColumnDto> Columns { get; set; } = new();
    public string? IncludeColumnsCsv { get; set; }
}

public class IndexColumnDto
{
    [Required] public string ColumnName { get; set; } = default!;
    public bool Descending { get; set; }
}

public class CheckConstraintDto
{
    public string? Name { get; set; }
    [Required] public string Expression { get; set; } = default!;
}

public class UniqueConstraintDto
{
    public string? Name { get; set; }
    [Required] public string ColumnsCsv { get; set; } = default!;
}

public static class DtoMap
{
    public static Project ToEntity(this ProjectUpsertDto dto)
        => new()
        {
            Name = dto.Name,
            Description = dto.Description,
            Tables = dto.Tables.Select(t => t.ToEntity()).ToList()
        };

    public static Table ToEntity(this TableDto dto)
        => new()
        {
            Schema = dto.Schema,
            Name = dto.Name,
            PrimaryKeyName = dto.PrimaryKeyName,
            Columns = dto.Columns.Select(c => c.ToEntity()).ToList(),
            ForeignKeys = dto.ForeignKeys.Select(fk => fk.ToEntity()).ToList(),
            Indexes = dto.Indexes.Select(i => i.ToEntity()).ToList(),
            CheckConstraints = dto.CheckConstraints.Select(cc => cc.ToEntity()).ToList(),
            UniqueConstraints = dto.UniqueConstraints.Select(uc => uc.ToEntity()).ToList()
        };

    public static Column ToEntity(this ColumnDto dto)
        => new()
        {
            Name = dto.Name,
            DataType = dto.DataType,
            Length = dto.Length,
            Precision = dto.Precision,
            Scale = dto.Scale,
            IsNullable = dto.IsNullable,
            IsPrimaryKey = dto.IsPrimaryKey,
            PrimaryKeyOrder = dto.PrimaryKeyOrder,
            IsIdentity = dto.IsIdentity,
            IdentitySeed = dto.IdentitySeed,
            IdentityIncrement = dto.IdentityIncrement,
            DefaultSql = dto.DefaultSql,
            DefaultKind = dto.DefaultKind,
            IsUnique = dto.IsUnique
        };

    public static ForeignKey ToEntity(this ForeignKeyDto dto)
        => new()
        {
            Name = dto.Name,
            RefSchema = dto.RefSchema,
            RefTable = dto.RefTable,
            OnDeleteAction = dto.OnDeleteAction,
            Columns = dto.Columns.Select(c => new ForeignKeyColumn
            {
                ColumnName = c.ColumnName,
                RefColumnName = c.RefColumnName
            }).ToList()
        };

    public static Domain.Index ToEntity(this IndexDto dto)
        => new()
        {
            Name = dto.Name,
            IsUnique = dto.IsUnique,
            IncludeColumnsCsv = dto.IncludeColumnsCsv,
            Columns = dto.Columns.Select(c => new IndexColumn
            {
                ColumnName = c.ColumnName,
                Descending = c.Descending
            }).ToList()
        };

    public static CheckConstraint ToEntity(this CheckConstraintDto dto)
        => new()
        {
            Name = dto.Name,
            Expression = dto.Expression
        };

    public static UniqueConstraint ToEntity(this UniqueConstraintDto dto)
        => new()
        {
            Name = dto.Name,
            ColumnsCsv = dto.ColumnsCsv
        };

    // Odwrotne mapowania do odczytu
    public static ProjectUpsertDto ToDto(this Project e)
        => new()
        {
            Name = e.Name,
            Description = e.Description,
            Tables = e.Tables.Select(t => t.ToDto()).ToList()
        };

    public static TableDto ToDto(this Table e)
        => new()
        {
            Schema = e.Schema,
            Name = e.Name,
            PrimaryKeyName = e.PrimaryKeyName,
            Columns = e.Columns.Select(c => c.ToDto()).ToList(),
            ForeignKeys = e.ForeignKeys.Select(fk => fk.ToDto()).ToList(),
            Indexes = e.Indexes.Select(i => i.ToDto()).ToList(),
            CheckConstraints = e.CheckConstraints.Select(cc => cc.ToDto()).ToList(),
            UniqueConstraints = e.UniqueConstraints.Select(uc => uc.ToDto()).ToList()
        };

    public static ColumnDto ToDto(this Column e)
        => new()
        {
            Name = e.Name,
            DataType = e.DataType,
            Length = e.Length,
            Precision = e.Precision,
            Scale = e.Scale,
            IsNullable = e.IsNullable,
            IsPrimaryKey = e.IsPrimaryKey,
            PrimaryKeyOrder = e.PrimaryKeyOrder,
            IsIdentity = e.IsIdentity,
            IdentitySeed = e.IdentitySeed,
            IdentityIncrement = e.IdentityIncrement,
            DefaultSql = e.DefaultSql,
            DefaultKind = e.DefaultKind,
            IsUnique = e.IsUnique
        };

    public static ForeignKeyDto ToDto(this ForeignKey e)
        => new()
        {
            Name = e.Name,
            RefSchema = e.RefSchema,
            RefTable = e.RefTable,
            OnDeleteAction = e.OnDeleteAction,
            Columns = e.Columns.Select(c => new ForeignKeyColumnDto
            {
                ColumnName = c.ColumnName,
                RefColumnName = c.RefColumnName
            }).ToList()
        };

    public static IndexDto ToDto(this Domain.Index e)
        => new()
        {
            Name = e.Name,
            IsUnique = e.IsUnique,
            IncludeColumnsCsv = e.IncludeColumnsCsv,
            Columns = e.Columns.Select(c => new IndexColumnDto
            {
                ColumnName = c.ColumnName,
                Descending = c.Descending
            }).ToList()
        };

    public static CheckConstraintDto ToDto(this CheckConstraint e)
        => new() { Name = e.Name, Expression = e.Expression };

    public static UniqueConstraintDto ToDto(this UniqueConstraint e)
        => new() { Name = e.Name, ColumnsCsv = e.ColumnsCsv };
}
