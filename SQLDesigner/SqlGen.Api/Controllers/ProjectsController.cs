using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SqlDesigner.Api.Data;
using SqlDesigner.Api.Domain;
using SqlDesigner.Api.DTOs;
using SqlDesigner.Api.Services;
using SqlGen.Api.Domain.Services;

namespace SqlDesigner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ISqlScriptBuilder _builder;

    public ProjectsController(AppDbContext db, ISqlScriptBuilder builder)
    {
        _db = db;
        _builder = builder;
    }

    /// <summary>Lista projektów (skrótowo)</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProjectListItemDto>>> GetAll()
    {
        var items = await _db.Projects
            .Select(p => new ProjectListItemDto(p.Id, p.Name, p.Tables.Count))
            .ToListAsync();

        return Ok(items);
    }

    /// <summary>Pobierz projekt z pełną strukturą</summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProjectUpsertDto>> Get(int id)
    {
        var project = await _db.Projects
            .Include(p => p.Tables)
                .ThenInclude(t => t.Columns)
            .Include(p => p.Tables)
                .ThenInclude(t => t.ForeignKeys)
                    .ThenInclude(fk => fk.Columns)
            .Include(p => p.Tables)
                .ThenInclude(t => t.Indexes)
                    .ThenInclude(i => i.Columns)
            .Include(p => p.Tables)
                .ThenInclude(t => t.CheckConstraints)
            .Include(p => p.Tables)
                .ThenInclude(t => t.UniqueConstraints)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project is null) return NotFound();

        return Ok(project.ToDto());
    }

    /// <summary>Utwórz nowy projekt (z pełną strukturą)</summary>
    [HttpPost]
    public async Task<ActionResult<IdResponse>> Create([FromBody] ProjectUpsertDto dto)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var entity = dto.ToEntity();
        _db.Projects.Add(entity);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = entity.Id }, new IdResponse(entity.Id));
    }

    /// <summary>Nadpisz istniejący projekt (zastępuje całą strukturę)</summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult> Replace(int id, [FromBody] ProjectUpsertDto dto)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var existing = await _db.Projects
            .Include(p => p.Tables)
                .ThenInclude(t => t.Columns)
            .Include(p => p.Tables)
                .ThenInclude(t => t.ForeignKeys)
                    .ThenInclude(fk => fk.Columns)
            .Include(p => p.Tables)
                .ThenInclude(t => t.Indexes)
                    .ThenInclude(i => i.Columns)
            .Include(p => p.Tables)
                .ThenInclude(t => t.CheckConstraints)
            .Include(p => p.Tables)
                .ThenInclude(t => t.UniqueConstraints)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (existing is null) return NotFound();

        using var tx = await _db.Database.BeginTransactionAsync();

        try
        {
            _db.Remove(existing);
            await _db.SaveChangesAsync();

            var replacement = dto.ToEntity();
            replacement.Id = id;
            _db.Projects.Add(replacement);
            await _db.SaveChangesAsync();

            await tx.CommitAsync();
            return NoContent();
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    /// <summary>Usuń projekt</summary>
    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.Id == id);
        if (project is null) return NotFound();
        _db.Projects.Remove(project);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>Wygeneruj skrypt T-SQL dla projektu</summary>
    [HttpPost("{id:int}/generate")]
    public async Task<ActionResult> Generate(int id)
    {
        var project = await _db.Projects
            .Include(p => p.Tables)
                .ThenInclude(t => t.Columns)
            .Include(p => p.Tables)
                .ThenInclude(t => t.ForeignKeys)
                    .ThenInclude(fk => fk.Columns)
            .Include(p => p.Tables)
                .ThenInclude(t => t.Indexes)
                    .ThenInclude(i => i.Columns)
            .Include(p => p.Tables)
                .ThenInclude(t => t.CheckConstraints)
            .Include(p => p.Tables)
                .ThenInclude(t => t.UniqueConstraints)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project is null) return NotFound();

        var sql = _builder.BuildProjectScript(project);

        return File(System.Text.Encoding.UTF8.GetBytes(sql), "text/plain", $"{SanitizeFileName(project.Name)}.sql");
    }

    private static string SanitizeFileName(string name)
    {
        foreach (var c in Path.GetInvalidFileNameChars())
            name = name.Replace(c, '_');
        return name.Trim();
    }
}
