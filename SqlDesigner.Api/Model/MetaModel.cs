namespace SqlDesigner.Api.Model;

public record ProjectDto(string Name, List<EntityDto> Entities, List<RelationDto> Relations);

public record EntityDto
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Name { get; set; } = "";
    public string? Schema { get; set; } = "dbo";
    public List<FieldDto> Fields { get; init; } = new();
    public double? X { get; set; }
    public double? Y { get; set; }
}

public record FieldDto
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Name { get; set; } = "";
    public string Type { get; set; } = "string";
    public int? Length { get; set; }
    public int? Precision { get; set; }
    public int? Scale { get; set; }
    public bool IsNullable { get; set; }
    public bool IsPrimaryKey { get; set; }
    public bool IsIdentity { get; set; }
    public string? DefaultExpression { get; set; }
    public bool IsUnique { get; set; }
}

public record RelationDto
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid FromEntityId { get; set; }
    public Guid ToEntityId { get; set; }
    public List<FieldMapDto> Mappings { get; init; } = new();
    public string OnDelete { get; set; } = "NO ACTION";
}

public record FieldMapDto(Guid FromFieldId, Guid ToFieldId);
