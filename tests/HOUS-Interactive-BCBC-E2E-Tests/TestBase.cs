using System.Threading.Tasks;
using Microsoft.Playwright;
using NUnit.Framework;

namespace HOUSInteractiveBCBCE2ETests;

public abstract class TestBase
{
    public static readonly string BaseUrl = Environment.GetEnvironmentVariable("BASE_URL") ?? "http://localhost:4173/";
    public static readonly int DefaultTimeout = 10_000;
    public static readonly int NavigationTimeout = 20_000;
    public static readonly int ViewportSizeWidth = 1280;
    public static readonly int ViewportSizeHeight = 720;

    protected IPlaywright Playwright = null!;
    protected IBrowser Browser = null!;
    protected IBrowserContext Context = null!;
    protected IPage Page = null!;

    [SetUp]
    public async Task SetUp()
    {
        Playwright = await Microsoft.Playwright.Playwright.CreateAsync();

        Browser = await Playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
        {
            //Headless = false,
            //SlowMo = 0
        });

        Context = await Browser.NewContextAsync(new BrowserNewContextOptions
        {
            ViewportSize = new ViewportSize { Width = ViewportSizeWidth, Height = ViewportSizeHeight }
        });

        Page = await Context.NewPageAsync();

        Page.SetDefaultTimeout(DefaultTimeout);
        Page.SetDefaultNavigationTimeout(NavigationTimeout);
    }

    [TearDown]
    public async Task TearDown()
    {
        if (Context is not null) await Context.CloseAsync();
        if (Browser is not null) await Browser.CloseAsync();
        Playwright?.Dispose();
    }
}
