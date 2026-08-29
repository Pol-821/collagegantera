FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 5000

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

COPY ["Backend/CollaGegantera.Api.csproj", "Backend/"]
COPY ["Shared/CollaGegantera.Shared.csproj", "Shared/"]
RUN dotnet restore "Backend/CollaGegantera.Api.csproj"

COPY Backend/ Backend/
COPY Shared/ Shared/
WORKDIR "/src/Backend"
RUN dotnet build "CollaGegantera.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "CollaGegantera.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Create data directory for SQLite persistence
RUN mkdir -p /app/data

ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ConnectionStrings__DefaultConnection="Data Source=/app/data/collagegantera.db"

ENTRYPOINT ["dotnet", "CollaGegantera.Api.dll"]
