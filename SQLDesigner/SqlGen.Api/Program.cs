using Microsoft.EntityFrameworkCore;
using SqlDesigner.Api.Data;
using SqlDesigner.Api.Services;
using SqlGen.Api.Domain.Services;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// DbContext
builder.Services.AddDbContext<AppDbContext>(opt =>
{
    var cs = builder.Configuration.GetConnectionString("DefaultConnection");
    opt.UseSqlServer(cs, sql =>
    {
        sql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
    });
});

// Services
builder.Services.AddScoped<ISqlScriptBuilder, SqlServerScriptBuilder>();

// Controllers + JSON
builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        o.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        o.JsonSerializerOptions.WriteIndented = true;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();
app.UseRouting();
app.MapControllers();

app.Run();
