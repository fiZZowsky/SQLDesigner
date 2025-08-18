namespace SqlDesigner.Api.Domain;

public class Project
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public List<Table> Tables { get; set; } = new();
}

public class Table
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public Project? Project { get; set; }

    public string Schema { get; set; } = "dbo";
    public string Name { get; set; } = default!;

    // Dodatkowa nazwa PK (opcjonalnie)
    public string? PrimaryKeyName { get; set; }

    public List<Column> Columns { get; set; } = new();
    public List<ForeignKey> ForeignKeys { get; set; } = new();
    public List<Index> Indexes { get; set; } = new();
    public List<CheckConstraint> CheckConstraints { get; set; } = new();
    public List<UniqueConstraint> UniqueConstraints { get; set; } = new();
}

public enum SqlDefaultKind
{
    None = 0,
    // traktuj DefaultSql jako surowy SQL (np. GETDATE(), NEWID(), (1+2))
    RawExpression = 1,
    // traktuj DefaultSql jako literal, automatycznie opakuj w '' jeśli to string
    Literal = 2
}

public class Column
{
    public int Id { get; set; }
    public int TableId { get; set; }
    public Table? Table { get; set; }

    public string Name { get; set; } = default!;

    // np. "int", "nvarchar", "decimal", "datetime2"
    public string DataType { get; set; } = default!;
    public int? Length { get; set; }               // dla (n)var{char}
    public int? Precision { get; set; }            // dla decimal/num
    public int? Scale { get; set; }                // dla decimal/num

    public bool IsNullable { get; set; }
    public bool IsPrimaryKey { get; set; }
    public int? PrimaryKeyOrder { get; set; }      // dla złożonych PK

    public bool IsIdentity { get; set; }
    public int IdentitySeed { get; set; } = 1;
    public int IdentityIncrement { get; set; } = 1;

    public string? DefaultSql { get; set; }
    public SqlDefaultKind DefaultKind { get; set; } = SqlDefaultKind.None;

    public bool IsUnique { get; set; } // unikalność pojedynczej kolumny
}

public class ForeignKey
{
    public int Id { get; set; }
    public int TableId { get; set; }
    public Table? Table { get; set; }

    public string? Name { get; set; }
    public string RefSchema { get; set; } = "dbo";
    public string RefTable { get; set; } = default!;
    public string? OnDeleteAction { get; set; } // "NO ACTION" | "CASCADE" | "SET NULL" | "SET DEFAULT"

    public List<ForeignKeyColumn> Columns { get; set; } = new();
}

public class ForeignKeyColumn
{
    public int Id { get; set; }
    public int ForeignKeyId { get; set; }
    public ForeignKey? ForeignKey { get; set; }

    public string ColumnName { get; set; } = default!;
    public string RefColumnName { get; set; } = default!;
}

public class Index
{
    public int Id { get; set; }
    public int TableId { get; set; }
    public Table? Table { get; set; }

    public string? Name { get; set; }
    public bool IsUnique { get; set; }
    public List<IndexColumn> Columns { get; set; } = new();
    public string? IncludeColumnsCsv { get; set; } // opcjonalnie: "ColA,ColB"
}

public class IndexColumn
{
    public int Id { get; set; }
    public int IndexId { get; set; }
    public Index? Index { get; set; }

    public string ColumnName { get; set; } = default!;
    public bool Descending { get; set; }
}

public class CheckConstraint
{
    public int Id { get; set; }
    public int TableId { get; set; }
    public Table? Table { get; set; }

    public string? Name { get; set; }
    public string Expression { get; set; } = default!;
}

public class UniqueConstraint
{
    public int Id { get; set; }
    public int TableId { get; set; }
    public Table? Table { get; set; }

    public string? Name { get; set; }
    public string ColumnsCsv { get; set; } = default!;
}
