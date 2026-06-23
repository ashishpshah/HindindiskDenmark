using System.ComponentModel.DataAnnotations;

namespace HindIndisk.Api.Domain.Entities;

public class User
{
    public long Id { get; set; }
    public string Firstname { get; set; } = string.Empty;
    public string Lastname { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    [MaxLength(30)]
    public string Phone { get; set; } = string.Empty;
    public long RoleId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual Role Role { get; set; } = null!;
    public virtual ICollection<UserBranch> UserBranches { get; set; } = [];
    public virtual ICollection<UserAddress> UserAddresses { get; set; } = [];
    public virtual ICollection<Order> Orders { get; set; } = [];
    public virtual ICollection<Reservation> Reservations { get; set; } = [];
}
