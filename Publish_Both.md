# How `dotnet publish` Builds Both Server and Client

## Command
```
dotnet publish -c Release -o ./publish
```

The server `.csproj` now pins `<RuntimeIdentifier>win-x64</RuntimeIdentifier>` and
`<SelfContained>true</SelfContained>` as defaults, so the plain command above is enough —
it produces the same self-contained `win-x64` output as the older explicit form below (still
works identically if you type it out):
```
dotnet publish -c Release -r win-x64 --self-contained true -o ./publish
```

Also see `global.json` at the repo root — it pins the `dotnet` SDK to `8.0.420` so a newer
SDK installed on the machine (e.g. .NET 9/10) can never silently change what `dotnet
publish` produces for this net8.0 project.

## The Wiring

The server `.csproj` declares a `ProjectReference` to the client `.esproj`:

```xml
<ProjectReference Include="..\hindindisk.web.client\hindindisk.web.client.esproj">
  <ReferenceOutputAssembly>false</ReferenceOutputAssembly>
</ProjectReference>
```

The client uses the `Microsoft.VisualStudio.JavaScript.Sdk` — a special MSBuild SDK that registers Publish targets bridging a JS project into the .NET build pipeline.

## What Happens During `dotnet publish`

1. MSBuild walks the project graph and sees the server depends on the client `.esproj`.
2. It publishes the client first — the JavaScript SDK's publish target runs `npm run build` → `tsc -b && vite build` → outputs files to `dist/`.
3. The SDK copies the `dist/` files into the server's `wwwroot/` folder in the publish output.
4. The server's `app.UseDefaultFiles()` + `app.UseStaticFiles()` serve them as static assets.
5. `app.MapFallbackToFile("/index.html")` routes all non-API requests to the React SPA.

## Why `dotnet build` Does NOT Build the Client

The `.esproj` has:
```xml
<ShouldRunBuildScript>false</ShouldRunBuildScript>
```
This disables `npm run build` during `dotnet build`. Only publish triggers it. During local dev, the Vite dev server (`npm run dev`) runs separately.

## Summary

| Command           | Client built? | How                                      |
|-------------------|---------------|------------------------------------------|
| `dotnet build`    | No            | `ShouldRunBuildScript=false` skips it    |
| `dotnet publish`  | Yes           | JS SDK publish target runs `npm run build`, copies `dist/` → `wwwroot/` |
