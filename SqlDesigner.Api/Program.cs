using Microsoft.EntityFrameworkCore;
using SqlDesigner.Api.Data;
using SqlDesigner.Api.Model;
using SqlDesigner.Api.Services;
using System.Text.Json;
using System.Linq;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlite(builder.Configuration.GetConnectionString("Default")
                   ?? "Data Source=app.db"));

builder.Services.AddCors(opt =>
{
    opt.AddPolicy("dev", p => p
        .WithOrigins("http://localhost:4200")
        .AllowAnyHeader()
        .AllowAnyMethod());
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSingleton<SqlGenerator>();

var app = builder.Build();

app.UseCors("dev");
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapGet("/", () => Results.Redirect("/swagger"));

var group = app.MapGroup("/projects");

// list
group.MapGet("/", async (AppDbContext db) =>
{
    var list = await db.Projects
        .OrderByDescending(p => p.UpdatedAtUtc)
        .Select(p => new { p.Id, p.Name, p.UpdatedAtUtc })
        .ToListAsync();
    return Results.Ok(list);
});

// get by id
group.MapGet("/{id:guid}", async (Guid id, AppDbContext db) =>
{
    var row = await db.Projects.FindAsync(id);
    return row is null ? Results.NotFound() : Results.Ok(row);
});

// create
group.MapPost("/", async (ProjectIn input, AppDbContext db) =>
{
    var row = new ProjectRow { Id = Guid.NewGuid(), Name = input.Name, DataJson = input.DataJson };
    db.Projects.Add(row);
    await db.SaveChangesAsync();
    return Results.Created($"/projects/{row.Id}", row);
});

// update
group.MapPut("/{id:guid}", async (Guid id, ProjectIn input, AppDbContext db) =>
{
    var row = await db.Projects.FindAsync(id);
    if (row is null) return Results.NotFound();
    row.Name = input.Name;
    row.DataJson = input.DataJson;
    row.UpdatedAtUtc = DateTime.UtcNow;
    await db.SaveChangesAsync();
    return Results.Ok(row);
});

// delete
group.MapDelete("/{id:guid}", async (Guid id, AppDbContext db) =>
{
    var row = await db.Projects.FindAsync(id);
    if (row is null) return Results.NotFound();
    db.Projects.Remove(row);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// generate SQL (tekst)
group.MapPost("/{id:guid}/generate", async (Guid id, AppDbContext db, SqlGenerator gen) =>
{
    var row = await db.Projects.FindAsync(id);
    if (row is null) return Results.NotFound();

    var dto = JsonSerializer.Deserialize<ProjectDto>(row.DataJson, new JsonSerializerOptions
    {
        PropertyNameCaseInsensitive = true
    });
    if (dto is null) return Results.BadRequest("Invalid project JSON.");

    var sql = gen.Generate(dto);
    return Results.Text(sql, "text/plain");
});

app.Run();
record ProjectIn(string Name, string DataJson);