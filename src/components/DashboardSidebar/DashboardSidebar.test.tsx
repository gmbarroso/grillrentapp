import { describe, expect, it, vi } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { StaticRouter } from "react-router-dom"
import DashboardSidebar from "./DashboardSidebar"

vi.mock("../../context/ThemeContext", () => ({
  useTheme: () => ({ themeMode: "light", setThemeMode: vi.fn() }),
}))

function renderSidebar(showNameInSidebar?: boolean, logo: string | null = "/logo.png", mobile = false) {
  return renderToStaticMarkup(
    <StaticRouter location="/">
      <DashboardSidebar
        condominiumName="Condomínio Teste"
        condominiumSubtitle=""
        showNameInSidebar={showNameInSidebar}
        organizationLogoUrl={logo}
        primaryNav={[]}
        adminNav={[]}
        userName="Morador"
        userContext="Apt 1"
        isCollapsed={false}
        isMobileViewport={mobile}
        isMobileOpen={mobile}
        onCloseMobile={() => {}}
        onLogout={() => {}}
      />
    </StaticRouter>,
  )
}

describe("DashboardSidebar name visibility", () => {
  it("shows the registered name by default for existing responses", () => {
    expect(renderSidebar()).toContain("Condomínio Teste</h2>")
  })

  it("shows the name when explicitly enabled", () => {
    expect(renderSidebar(true)).toContain("Condomínio Teste</h2>")
  })

  it.each([false, true])("hides the name and keeps a centered logo (mobile=%s)", (mobile) => {
    const html = renderSidebar(false, "/logo.png", mobile)
    expect(html).not.toContain("Condomínio Teste")
    expect(html).toContain('src="/logo.png"')
    expect(html).toContain('class="dashboard-condominium no-name"')
  })

  it("keeps the default brand when the name is hidden and there is no logo", () => {
    const html = renderSidebar(false, null)
    expect(html).not.toContain("Condomínio Teste")
    expect(html).toContain("/images/seu-ze-mascot.png")
  })
})
