namespace HindIndisk.Api.Application.DTOs.Admin;

public record MenuItemOrderEntry(long ItemId, int SortOrder);
public record ReorderMenuItemsRequest(IReadOnlyList<MenuItemOrderEntry> Items);
