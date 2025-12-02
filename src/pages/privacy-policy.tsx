import { Shield } from 'lucide-react'
import { LegalHeader } from '@/components/legal-header'
import { LegalFooter } from '@/components/legal-footer'
import { useI18n } from '@/hooks/use-i18n'
import { privacyContent } from '@/lib/legal-content'

export default function PrivacyPolicyPage() {
  const { t, locale } = useI18n()
  const content = privacyContent[locale as keyof typeof privacyContent] || privacyContent['en']

  return (
    <div className="min-h-screen bg-background">
      <LegalHeader />

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-foreground mb-4">
            {t('privacy.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('privacy.lastUpdated')}
          </p>
        </div>

        {/* Table of Contents */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">{t('privacy.tableOfContents')}</h2>
          <nav className="space-y-2">
            <a href="#introduction" className="block text-sm text-primary hover:underline">{t('privacy.section1')}</a>
            <a href="#information-we-collect" className="block text-sm text-primary hover:underline">{t('privacy.section2')}</a>
            <a href="#how-we-use" className="block text-sm text-primary hover:underline">{t('privacy.section3')}</a>
            <a href="#data-sharing" className="block text-sm text-primary hover:underline">{t('privacy.section4')}</a>
            <a href="#data-security" className="block text-sm text-primary hover:underline">{t('privacy.section5')}</a>
            <a href="#your-rights" className="block text-sm text-primary hover:underline">{t('privacy.section6')}</a>
            <a href="#cookies" className="block text-sm text-primary hover:underline">{t('privacy.section7')}</a>
            <a href="#data-retention" className="block text-sm text-primary hover:underline">{t('privacy.section8')}</a>
            <a href="#international-transfers" className="block text-sm text-primary hover:underline">{t('privacy.section9')}</a>
            <a href="#children" className="block text-sm text-primary hover:underline">{t('privacy.section10')}</a>
            <a href="#updates" className="block text-sm text-primary hover:underline">{t('privacy.section11')}</a>
            <a href="#contact" className="block text-sm text-primary hover:underline">{t('privacy.section12')}</a>
          </nav>
        </div>

        {/* Content Sections */}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          {/* Introduction */}
          <section id="introduction" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('privacy.section1')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {content.introduction.p1}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {content.introduction.p2}
            </p>
          </section>

          {/* Information We Collect */}
          <section id="information-we-collect" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('privacy.section2')}</h2>
            
            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">2.1 Information You Provide</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              {content.informationWeCollect.intro}
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              {content.informationWeCollect.provided.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">2.2 Information Collected Automatically</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              {content.informationWeCollect.intro}
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              {content.informationWeCollect.automated.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">2.3 Information from Third Parties</h3>
            <p className="text-muted-foreground leading-relaxed">
              {content.informationWeCollect.thirdParty}
            </p>
          </section>

          {/* How We Use Your Information */}
          <section id="how-we-use" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('privacy.section3')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              {content.howWeUse.intro}
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              {content.howWeUse.purposes.map((purpose, idx) => (
                <li key={idx}>{purpose}</li>
              ))}
            </ul>
          </section>

          {/* Data Sharing */}
          <section id="data-sharing" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('privacy.section4')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We may share your information in the following circumstances:
            </p>
            
            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">4.1 Service Providers</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We work with third-party service providers who assist us in operating our platform:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Supabase (authentication and database hosting)</li>
              <li>Cloud hosting providers (Vercel, Netlify)</li>
              <li>Payment processors (Stripe)</li>
              <li>Email service providers (SendGrid, AWS SES)</li>
              <li>Analytics services (Google Analytics)</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">4.2 Legal Requirements</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We may disclose your information if required by law, court order, or government regulation, 
              or to protect our rights, property, or safety.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">4.3 Business Transfers</h3>
            <p className="text-muted-foreground leading-relaxed">
              In the event of a merger, acquisition, or sale of assets, your information may be transferred 
              to the acquiring entity.
            </p>
          </section>

          {/* Data Security */}
          <section id="data-security" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('privacy.section5')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Encryption of data in transit (SSL/TLS) and at rest</li>
              <li>Secure password hashing using bcrypt</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Secure cloud infrastructure with ISO 27001 certification</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              However, no method of transmission over the internet is 100% secure. While we strive to protect 
              your information, we cannot guarantee absolute security.
            </p>
          </section>

          {/* Your Rights */}
          <section id="your-rights" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('privacy.section6')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              {content.yourRights.intro}
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              {content.yourRights.rights.map((right, idx) => (
                <li key={idx}>{right}</li>
              ))}
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              {content.yourRights.contact} <strong>isacar.dev@gmail.com</strong>
            </p>
          </section>

          {/* Cookies */}
          <section id="cookies" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('privacy.section7')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We use cookies and similar tracking technologies to enhance your experience:
            </p>
            
            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">7.1 Types of Cookies</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li><strong>Essential Cookies:</strong> Required for the platform to function (authentication, security)</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how you use our platform</li>
              <li><strong>Preference Cookies:</strong> Remember your settings (theme, language)</li>
              <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements (with consent)</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">7.2 Managing Cookies</h3>
            <p className="text-muted-foreground leading-relaxed">
              You can control cookies through your browser settings. Note that disabling certain cookies 
              may affect the functionality of our platform.
            </p>
          </section>

          {/* Data Retention */}
          <section id="data-retention" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('privacy.section8')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We retain your personal data for as long as necessary to provide our services and comply with legal obligations:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Active accounts: Data retained while account is active</li>
              <li>Closed accounts: Data deleted within 90 days unless required by law</li>
              <li>Backups: May be retained for up to 30 days</li>
              <li>Legal requirements: Retained as required by applicable laws</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You can request deletion of your account and data at any time through your account settings 
              or by contacting us.
            </p>
          </section>

          {/* International Transfers */}
          <section id="international-transfers" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('privacy.section9')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of residence. 
              These countries may have different data protection laws. We ensure appropriate safeguards are in place 
              to protect your data in accordance with this Privacy Policy and applicable laws, including Standard 
              Contractual Clauses approved by the European Commission.
            </p>
          </section>

          {/* Children */}
          <section id="children" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('privacy.section10')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our services are not intended for individuals under the age of 18. We do not knowingly collect 
              personal information from children. If you believe we have collected information from a child, 
              please contact us immediately, and we will take steps to delete such information.
            </p>
          </section>

          {/* Updates */}
          <section id="updates" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('privacy.section11')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. 
              We will notify you of any material changes by posting the new policy on this page and updating the 
              "Last Updated" date. We encourage you to review this policy periodically.
            </p>
          </section>

          {/* Contact */}
          <section id="contact" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('privacy.section12')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {content.contact.intro}
            </p>
            <div className="bg-card border border-border rounded-lg p-6">
              <p className="text-foreground font-semibold mb-2">{content.contact.company}</p>
              <p className="text-muted-foreground mb-1">
                {content.contact.email}: <a href="mailto:isacar.dev@gmail.com" className="text-primary hover:underline">isacar.dev@gmail.com</a>
              </p>
              <p className="text-muted-foreground mb-1">
                {content.contact.support}: <a href="mailto:isacar.dev@gmail.com" className="text-primary hover:underline">isacar.dev@gmail.com</a>
              </p>
              <p className="text-muted-foreground">
                {content.contact.website}: <a href="https://isacar.dev" className="text-primary hover:underline">https://isacar.dev</a>
              </p>
            </div>
          </section>
        </div>
      </main>

      <LegalFooter />
    </div>
  )
}
