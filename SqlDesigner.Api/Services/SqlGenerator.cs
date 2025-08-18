using Scriban;
using SqlDesigner.Api.Model;

namespace SqlDesigner.Api.Services;

public class SqlGenerator
{
    private static readonly Template Template = Template.Parse(TemplateText);

    public string Generate(ProjectDto project)
    {
        var ctx = new TemplateContext();
        var so = new Scriban.Runtime.ScriptObject();
        so.Add("project", project);
        so.Add("map_type", new Func<FieldDto, string>(MapType));
        so.Add("entity", new Func<Guid, EntityDto>(id => project.Entities.First(e => e.Id == id)));
        so.Add("fieldById", new Func<Guid, FieldDto>(id => project.Entities.SelectMany(e => e.Fields).First(f => f.Id == id)));
        ctx.PushGlobal(so);
        return Template.Render(ctx);
    }

    private static string MapType(FieldDto f) => f.Type switch
    {
        "string" => f.Length is { } len ? $"NVARCHAR({len})" : "NVARCHAR(MAX)",
        "int" => "INT",
        "number" => f.Precision is { } p && f.Scale is { } s ? $"DECIMAL({p},{s})" : "DECIMAL(18,2)",
        "bool" => "BIT",
        "date" => "DATE",
        "datetime" => "DATETIME2",
        _ => "NVARCHAR(MAX)"
    };

    private const string TemplateText = @"
    {{ for e in project.entities -}}
    IF OBJECT_ID('{{e.Schema}}.{{e.Name}}', 'U') IS NULL
    BEGIN
    CREATE TABLE [{{e.Schema}}].[{{e.Name}}] (
      {{ for f in e.Fields -}}
      [{{f.Name}}] {{ map_type f }}{{ if f.IsIdentity }} IDENTITY(1,1){{ end }} {{ if not f.IsNullable }} NOT NULL{{ end }}{{ if f.DefaultExpression }} DEFAULT {{ f.DefaultExpression }}{{ end }}{{ if !for.last }},{{ end }}
      {{ end }}
      {{ if e.Fields.any f => f.IsPrimaryKey -}}
      ,CONSTRAINT [PK_{{e.Name}}] PRIMARY KEY (
        {{ for f in e.Fields where f.IsPrimaryKey; separator=', ' -}}[{{f.Name}}]{{ end }}
      )
      {{- end }}
    );
    END
    GO

    {{ end -}}

    -- Foreign Keys
    {{ for r in project.relations -}}
    ALTER TABLE [{{ entity(r.FromEntityId).Schema }}].[{{ entity(r.FromEntityId).Name }}]
    ADD CONSTRAINT [FK_{{ entity(r.FromEntityId).Name }}_{{ entity(r.ToEntityId).Name }}]
    FOREIGN KEY ({{ for m in r.Mappings; separator=', ' -}}[{{ fieldById(m.FromFieldId).Name }}]{{ end }})
    REFERENCES [{{ entity(r.ToEntityId).Schema }}].[{{ entity(r.ToEntityId).Name }}] ({{ for m in r.Mappings; separator=', ' -}}[{{ fieldById(m.ToFieldId).Name }}]{{ end }})
    ON DELETE {{ r.OnDelete }};
    GO
    {{ end }}";
}
