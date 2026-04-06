export interface NavItem {
  title: string
  href: string
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const styleguideNav: NavSection[] = [
  {
    title: "Fundação",
    items: [
      { title: "Visão Geral", href: "/styleguide" },
    ],
  },
  {
    title: "Componentes",
    items: [
      { title: "Botões", href: "/styleguide/components/button" },
      { title: "Cards", href: "/styleguide/components/card" },
      { title: "Formulários", href: "/styleguide/components/input" },
      { title: "Alertas", href: "/styleguide/components/alert" },
      { title: "Badges", href: "/styleguide/components/badge" },
      { title: "Tabela de Serviços", href: "/styleguide/components/table" },
      { title: "Header e Footer", href: "/styleguide/components/header" },
      { title: "Progress", href: "/styleguide/components/progress" },
      { title: "Tabela de Normas", href: "/styleguide/components/normas" },
      { title: "Upload de Documentos", href: "/styleguide/components/upload" },
      { title: "Icon Box", href: "/styleguide/components/icon-box" },
      { title: "Spinner", href: "/styleguide/components/spinner" },
      { title: "Breadcrumb", href: "/styleguide/components/breadcrumb" },
      { title: "Divider", href: "/styleguide/components/divider" },
      { title: "Legislação e Modalidades", href: "/styleguide/components/legislacao" },
    ],
  },
]
