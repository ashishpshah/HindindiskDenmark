using System.ComponentModel.DataAnnotations;

namespace HindIndisk.Api.Application.DTOs.Schedule;

public class UpsertDayScheduleRequest
{
    [Range(0, 6)]
    public int DayOfWeek { get; set; }

    [Required, RegularExpression(@"^\d{2}:\d{2}$")]
    public string OpenTime { get; set; } = string.Empty;

    [Required, RegularExpression(@"^\d{2}:\d{2}$")]
    public string CloseTime { get; set; } = string.Empty;

    [Range(15, 120)]
    public int SlotIntervalMinutes { get; set; } = 30;

    [Range(1, 1000)]
    public int MaxOrdersPerSlot { get; set; } = 10;

    [Range(1, 1000)]
    public int MaxReservationsPerSlot { get; set; } = 5;
}
