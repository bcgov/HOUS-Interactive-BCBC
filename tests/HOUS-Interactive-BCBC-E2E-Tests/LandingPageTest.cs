using System.Threading.Tasks;
using NUnit.Framework;
using Microsoft.Playwright;

namespace HOUSInteractiveBCBCE2ETests;

[TestFixture]
public class LandingPageTest : TestBase
{

    [Test]
    public async Task LandingPageHasBCBuildingCodeInTitle()
    {
        await Page.GotoAsync(BaseUrl);
        // TODO 
        Assert.That(true);
    }

}
