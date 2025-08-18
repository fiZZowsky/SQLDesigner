using Microsoft.EntityFrameworkCore;
using SqlDesigner.Api.Domain;

namespace SqlDesigner.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Table> Tables => Set<Table>();
    public DbSet<Column> Columns => Set<Column>();
    public DbSet<ForeignKey> ForeignKeys => Set<ForeignKey>();
    public DbSet<ForeignKeyColumn> ForeignKeyColumns => Set<ForeignKeyColumn>();
    public DbSet<Domain.Index> Indexes => Set<Domain.Index>();
    public DbSet<IndexColumn> IndexColumns => Set<IndexColumn>();
    public DbSet<CheckConstraint> CheckConstraints => Set<CheckConstraint>();
    public DbSet<UniqueConstraint> UniqueConstraints => Set<UniqueConstraint>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Project>(e =>
        {
            e.Property(p => p.Name).HasMaxLength(200).IsRequired();
            e.HasMany(p => p.Tables)
             .WithOne(t => t.Project)
             .HasForeignKey(t => t.ProjectId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Table>(e =>
        {
            e.Property(t => t.Name).HasMaxLength(200).IsRequired();
            e.Property(t => t.Schema).HasMaxLength(128).HasDefaultValue("dbo");
            e.HasIndex(t => new { t.ProjectId, t.Schema, t.Name }).IsUnique();

            e.HasMany(t => t.Columns)
             .WithOne(c => c.Table)
             .HasForeignKey(c => c.TableId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasMany(t => t.ForeignKeys)
             .WithOne(fk => fk.Table)
             .HasForeignKey(fk => fk.TableId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasMany(t => t.Indexes)
             .WithOne(i => i.Table)
             .HasForeignKey(i => i.TableId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasMany(t => t.CheckConstraints)
             .WithOne(cc => cc.Table)
             .HasForeignKey(cc => cc.TableId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasMany(t => t.UniqueConstraints)
             .WithOne(uc => uc.Table)
             .HasForeignKey(uc => uc.TableId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Column>(e =>
        {
            e.Property(c => c.Name).HasMaxLength(200).IsRequired();
            e.Property(c => c.DataType).HasMaxLength(128).IsRequired();
        });

        b.Entity<ForeignKey>(e =>
        {
            e.Property(f => f.Name).HasMaxLength(256);
            e.Property(f => f.RefSchema).HasMaxLength(128).HasDefaultValue("dbo");
            e.Property(f => f.RefTable).HasMaxLength(200).IsRequired();

            e.HasMany(f => f.Columns)
             .WithOne(fc => fc.ForeignKey)
             .HasForeignKey(fc => fc.ForeignKeyId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<ForeignKeyColumn>(e =>
        {
            e.Property(fc => fc.ColumnName).HasMaxLength(200).IsRequired();
            e.Property(fc => fc.RefColumnName).HasMaxLength(200).IsRequired();
        });

        b.Entity<Domain.Index>(e =>
        {
            e.Property(i => i.Name).HasMaxLength(256);
            e.HasMany(i => i.Columns)
             .WithOne(ic => ic.Index)
             .HasForeignKey(ic => ic.IndexId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<IndexColumn>(e =>
        {
            e.Property(ic => ic.ColumnName).HasMaxLength(200).IsRequired();
        });

        b.Entity<CheckConstraint>(e =>
        {
            e.Property(cc => cc.Name).HasMaxLength(256);
            e.Property(cc => cc.Expression).HasMaxLength(4000).IsRequired();
        });

        b.Entity<UniqueConstraint>(e =>
        {
            e.Property(uc => uc.Name).HasMaxLength(256);
            e.Property(uc => uc.ColumnsCsv).HasMaxLength(2000).IsRequired();
        });
    }
}
