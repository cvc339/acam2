"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function HeaderShowcase() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Header e Footer</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Cabeçalho com logo, navegação e créditos. Footer escuro. Classes centralizadas: acam-header, acam-footer.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Header público (landing, login, cadastro)</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-hidden rounded-b-lg">
          <div className="acam-header relative">
            <div className="acam-header-content">
              <div className="acam-header-logo">
                <div className="acam-header-logo-icon">
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                  </svg>
                </div>
                <div>
                  <div className="acam-header-logo-title">ACAM</div>
                  <div className="acam-header-logo-subtitle">Compensações Ambientais</div>
                </div>
              </div>
              <div className="acam-header-nav">
                <span className="acam-header-nav-link">Compensações</span>
                <span className="acam-header-nav-link">Como funciona</span>
                <Button variant="ghost" size="sm">Entrar</Button>
                <Button size="sm">Criar conta</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Header logado (dashboard)</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-hidden rounded-b-lg">
          <div className="acam-header relative">
            <div className="acam-header-content">
              <div className="acam-header-logo">
                <div className="acam-header-logo-icon">
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                  </svg>
                </div>
                <div>
                  <div className="acam-header-logo-title">ACAM</div>
                  <div className="acam-header-logo-subtitle">Olá, Carlos</div>
                </div>
              </div>
              <div className="acam-header-nav">
                <div className="acam-header-credits">
                  <span className="acam-header-credits-label">Créditos:</span>
                  <span className="acam-header-credits-value">23</span>
                </div>
                <Button size="sm">Comprar</Button>
                <Button variant="ghost" size="sm">Sair</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Service header (página de ferramenta)</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-hidden rounded-b-lg">
          <div className="acam-service-header acam-service-header-primary relative">
            <div className="acam-service-header-content">
              <div className="acam-service-header-info">
                <div className="acam-service-header-icon">UC</div>
                <div className="acam-service-header-text">
                  <h1>Destinação em UC — Base</h1>
                  <p>Análise de viabilidade para regularização fundiária em UC</p>
                </div>
              </div>
              <div className="acam-service-header-cost">
                <div className="acam-service-header-cost-label">Custo</div>
                <div className="acam-service-header-cost-value">5 créditos</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Footer</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-hidden rounded-b-lg">
          <div className="acam-footer relative">
            <div className="acam-footer-content">
              <span className="acam-footer-text">© 2026 ACAM. Todos os direitos reservados.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
