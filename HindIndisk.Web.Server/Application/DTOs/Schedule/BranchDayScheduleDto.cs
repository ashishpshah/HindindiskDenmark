namespace HindIndisk.Api.Application.DTOs.Schedule;

public record BranchDayScheduleDto(
    int    DayOfWeek,
    string DayName,
    string OpenTime,
    string CloseTime,
    int    SlotIntervalMinutes,
    int    MaxOrdersPerSlot,
    int    MaxReservationsPerSlot,
    bool   IsOpen,
    string? OffMessage,
    string? OffMessageDa
);
