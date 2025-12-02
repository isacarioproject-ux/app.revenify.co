import { Link } from 'react-router-dom'
import {
  FacebookIcon,
  GithubIcon,
  InstagramIcon,
  LinkedinIcon,
  TwitterIcon,
  YoutubeIcon,
} from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'

export function LegalFooter() {
  const { t, locale } = useI18n()
  const year = new Date().getFullYear()

  const company = [
    {
      key: 'legal.footer.links.about',
      href: locale === 'en' ? '/company' : '/empresa',
    },
    {
      key: 'legal.footer.links.clients',
      href: locale === 'en' ? '/clients' : '/clientes',
    },
    {
      key: 'legal.footer.links.careers',
      href: locale === 'en' ? '/careers' : '/empresa',
    },
    {
      key: 'legal.footer.links.privacy',
      href: '/privacy-policy',
    },
    {
      key: 'legal.footer.links.terms',
      href: '/terms-of-service',
    },
  ]

  const resources = [
    {
      key: 'legal.footer.links.blog',
      href: locale === 'en' ? '/blog' : '/recursos',
    },
    {
      key: 'legal.footer.links.docs',
      href: locale === 'en' ? '/docs' : '/recursos',
    },
    {
      key: 'legal.footer.links.support',
      href: locale === 'en' ? '/support' : '/recursos',
    },
    {
      key: 'legal.footer.links.community',
      href: locale === 'en' ? '/community' : '/recursos',
    },
    {
      key: 'legal.footer.links.status',
      href: locale === 'en' ? '/status' : '/recursos',
    },
  ]

  const socialLinks = [
    {
      icon: <TwitterIcon className="size-4" />,
      link: 'https://twitter.com/isacar',
    },
    {
      icon: <GithubIcon className="size-4" />,
      link: 'https://github.com/isacarioproject-ux',
    },
    {
      icon: <LinkedinIcon className="size-4" />,
      link: 'https://linkedin.com/company/isacar',
    },
    {
      icon: <YoutubeIcon className="size-4" />,
      link: 'https://youtube.com/@isacar',
    },
    {
      icon: <FacebookIcon className="size-4" />,
      link: 'https://facebook.com/isacar',
    },
    {
      icon: <InstagramIcon className="size-4" />,
      link: 'https://instagram.com/isacar',
    },
  ]

  return (
    <footer className="relative mt-16">
      <div className="bg-[radial-gradient(35%_80%_at_30%_0%,hsl(var(--foreground)/.1),transparent)] mx-auto max-w-4xl md:border-x border-border">
        <div className="bg-border absolute inset-x-0 h-px w-full" />
        <div className="grid max-w-4xl grid-cols-6 gap-6 p-4">
          <div className="col-span-6 flex flex-col gap-5 md:col-span-4">
            <Link to="/auth" className="w-max">
              <span className="text-2xl font-serif font-bold tracking-tight text-foreground">
                Isacar.dev
              </span>
            </Link>
            <p className="text-muted-foreground max-w-sm font-mono text-sm text-balance">
              {t('legal.footer.tagline')}
            </p>
            <div className="flex gap-2">
              {socialLinks.map((item, i) => (
                <a
                  key={i}
                  className="hover:bg-accent rounded-md border border-border p-1.5 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={item.link}
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>
          <div className="col-span-3 w-full md:col-span-1">
            <span className="text-muted-foreground mb-1 text-xs">
              {t('legal.footer.resourcesTitle')}
            </span>
            <div className="flex flex-col gap-1">
              {resources.map(({ href, key }, i) => (
                <a
                  key={i}
                  className="w-max py-1 text-sm duration-200 hover:underline text-foreground"
                  href={href}
                >
                  {t(key)}
                </a>
              ))}
            </div>
          </div>
          <div className="col-span-3 w-full md:col-span-1">
            <span className="text-muted-foreground mb-1 text-xs">{t('legal.footer.companyTitle')}</span>
            <div className="flex flex-col gap-1">
              {company.map(({ href, key }, i) => (
                href.startsWith('/') ? (
                  <Link
                    key={i}
                    className="w-max py-1 text-sm duration-200 hover:underline text-foreground"
                    to={href}
                  >
                    {t(key)}
                  </Link>
                ) : (
                  <a
                    key={i}
                    className="w-max py-1 text-sm duration-200 hover:underline text-foreground"
                    href={href}
                  >
                    {t(key)}
                  </a>
                )
              ))}
            </div>
          </div>
        </div>
        <div className="bg-border absolute inset-x-0 h-px w-full" />
        <div className="flex max-w-4xl flex-col justify-between gap-2 pt-2 pb-5">
          <p className="text-muted-foreground text-center font-thin text-sm">
            © {year} Isacar.dev. {t('legal.footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  )
}
