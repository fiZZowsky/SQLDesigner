using SqlDesigner.Api.Domain;

namespace SqlGen.Api.Domain.Services;

public interface ISqlScriptBuilder
{
    string BuildProjectScript(Project project);
}
