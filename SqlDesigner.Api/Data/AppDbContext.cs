using Microsoft.EntityFrameworkCore;

namespace SqlDesigner.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<ProjectRow> Projects => Set<ProjectRow>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<ProjectRow>(e =>
        {
            e.ToTable("Projects");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired();
            e.Property(x => x.DataJson).HasColumnType("TEXT").IsRequired();
            e.Property(x => x.UpdatedAtUtc)
             .HasDefaultValueSql("CURRENT_TIMESTAMP");
        });
    }
}

public class ProjectRow
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string DataJson { get; set; } = "{}";
    public DateTime UpdatedAtUtc { get; set; }
}
