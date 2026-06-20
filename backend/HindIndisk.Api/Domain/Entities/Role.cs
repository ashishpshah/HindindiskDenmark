namespace HindIndisk.Api.Domain.Entities;

public class Role
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public virtual ICollection<User> Users { get; set; } = [];
}
