namespace HindIndisk.Api.Application.DTOs.Schedule;

public record SlotResultDto(bool IsOpen, IReadOnlyList<string> Slots, string? CloseNote = null);
