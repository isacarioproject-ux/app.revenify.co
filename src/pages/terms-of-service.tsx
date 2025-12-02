import { FileText } from 'lucide-react'
import { LegalHeader } from '@/components/legal-header'
import { LegalFooter } from '@/components/legal-footer'
import { useI18n } from '@/hooks/use-i18n'
import { termsContent } from '@/lib/legal-content'

export default function TermsOfServicePage() {
  const { t, locale } = useI18n()
  const content = termsContent[locale as keyof typeof termsContent] || termsContent['en']

  return (
    <div className="min-h-screen bg-background">
      <LegalHeader />

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-foreground mb-4">
            {t('terms.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('terms.lastUpdated')}
          </p>
        </div>

        {/* Table of Contents */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">{t('terms.tableOfContents')}</h2>
          <nav className="space-y-2">
            <a href="#acceptance" className="block text-sm text-primary hover:underline">{t('terms.section1')}</a>
            <a href="#description" className="block text-sm text-primary hover:underline">{t('terms.section2')}</a>
            <a href="#account" className="block text-sm text-primary hover:underline">{t('terms.section3')}</a>
            <a href="#acceptable-use" className="block text-sm text-primary hover:underline">{t('terms.section4')}</a>
            <a href="#intellectual-property" className="block text-sm text-primary hover:underline">{t('terms.section5')}</a>
            <a href="#user-content" className="block text-sm text-primary hover:underline">{t('terms.section6')}</a>
            <a href="#plans-payments" className="block text-sm text-primary hover:underline">{t('terms.section7')}</a>
            <a href="#limitation-liability" className="block text-sm text-primary hover:underline">{t('terms.section8')}</a>
            <a href="#warranties" className="block text-sm text-primary hover:underline">{t('terms.section9')}</a>
            <a href="#modifications" className="block text-sm text-primary hover:underline">{t('terms.section10')}</a>
            <a href="#termination" className="block text-sm text-primary hover:underline">{t('terms.section11')}</a>
            <a href="#disputes" className="block text-sm text-primary hover:underline">{t('terms.section12')}</a>
            <a href="#general" className="block text-sm text-primary hover:underline">{t('terms.section13')}</a>
            <a href="#contact" className="block text-sm text-primary hover:underline">{t('terms.section14')}</a>
          </nav>
        </div>

        {/* Content Sections */}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          {/* Acceptance */}
          <section id="acceptance" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.section1')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {content.acceptance.p1}
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {content.acceptance.p2}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {content.acceptance.p3}
            </p>
          </section>

          {/* Description */}
          <section id="description" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.section2')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              {content.description.intro}
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              {content.description.features.map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              {content.description.disclaimer}
            </p>
          </section>

          {/* Account */}
          <section id="account" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.section3')}</h2>
            
            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">3.1 Account Creation</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              To use certain features of the Service, you must register for an account. When creating an account, 
              you agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Be at least 18 years of age (or the age of majority in your jurisdiction)</li>
              <li>Have the legal capacity to enter into a binding contract</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">3.2 Account Security</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use of your account</li>
              <li>Using a strong, unique password for your account</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              We are not liable for any loss or damage arising from your failure to protect your account credentials.
            </p>
          </section>

          {/* Acceptable Use */}
          <section id="acceptable-use" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.section4')}</h2>
            
            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">4.1 Permitted Uses</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You may use the Service for lawful business and personal purposes in accordance with these Terms.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">4.2 Prohibited Activities</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Violate any applicable laws, regulations, or third-party rights</li>
              <li>Upload or share illegal, harmful, threatening, abusive, harassing, defamatory, or obscene content</li>
              <li>Impersonate any person or entity, or falsely represent your affiliation with any person or entity</li>
              <li>Interfere with or disrupt the Service or servers connected to the Service</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Use the Service to transmit viruses, malware, or other malicious code</li>
              <li>Scrape, crawl, or use automated means to access the Service without permission</li>
              <li>Use the Service for spam, phishing, or other fraudulent activities</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Remove or modify any copyright, trademark, or other proprietary notices</li>
              <li>Use the Service to compete with us or develop a competing product</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section id="intellectual-property" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.section5')}</h2>
            
            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">5.1 Our Rights</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The Service, including all content, features, functionality, software, text, graphics, logos, and design, 
              is owned by ISACAR and is protected by copyright, trademark, patent, trade secret, and other intellectual 
              property laws. You may not copy, modify, distribute, sell, or lease any part of the Service without our 
              express written permission.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">5.2 Trademarks</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              "ISACAR" and associated logos are trademarks of ISACAR Technologies. You may not use our trademarks 
              without our prior written consent.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">5.3 Feedback</h3>
            <p className="text-muted-foreground leading-relaxed">
              If you provide us with feedback, suggestions, or ideas about the Service, you grant us a worldwide, 
              royalty-free, perpetual, irrevocable license to use, modify, and incorporate such feedback into our 
              Service without any obligation to you.
            </p>
          </section>

          {/* User Content */}
          <section id="user-content" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.section6')}</h2>
            
            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">6.1 Your Rights</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You retain all ownership rights to the content you create, upload, or share through the Service 
              ("User Content"). We do not claim ownership of your User Content.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">6.2 License to ISACAR</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              By uploading User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, 
              reproduce, store, modify, and display your User Content solely for the purpose of providing and 
              improving the Service. This license terminates when you delete your User Content or your account, 
              except for content that has been shared with others and they have not deleted.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">6.3 Your Responsibilities</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You are solely responsible for your User Content and the consequences of sharing it. You represent and 
              warrant that:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>You own or have the necessary rights to your User Content</li>
              <li>Your User Content does not violate any third-party rights</li>
              <li>Your User Content complies with these Terms and applicable laws</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">6.4 Backup and Data Loss</h3>
            <p className="text-muted-foreground leading-relaxed">
              While we perform regular backups, we are not responsible for any loss or corruption of your User Content. 
              You are responsible for maintaining your own backups of important content.
            </p>
          </section>

          {/* Plans and Payments */}
          <section id="plans-payments" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.section7')}</h2>
            
            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">7.1 Subscription Plans</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We offer various subscription plans with different features and usage limits:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li><strong>Free Plan:</strong> Limited features and storage</li>
              <li><strong>Pro Plan:</strong> Enhanced features and increased limits</li>
              <li><strong>Team Plan:</strong> Collaboration features for teams</li>
              <li><strong>Enterprise Plan:</strong> Custom solutions for large organizations</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">7.2 Billing and Payment</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              By subscribing to a paid plan:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>You agree to pay all fees associated with your subscription</li>
              <li>Fees are billed in advance on a monthly or annual basis</li>
              <li>All payments are non-refundable except as required by law</li>
              <li>You authorize us to charge your payment method automatically</li>
              <li>You must provide current, complete, and accurate billing information</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">7.3 Price Changes</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We may change our pricing at any time. We will provide you with reasonable notice of any price changes. 
              Price changes will take effect at the start of your next billing cycle.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">7.4 Cancellation and Refunds</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You may cancel your subscription at any time through your account settings. Upon cancellation:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Your subscription will remain active until the end of your current billing period</li>
              <li>You will not receive a refund for the current billing period</li>
              <li>Your account will be downgraded to the Free plan at the end of the billing period</li>
              <li>Refunds may be provided at our sole discretion or as required by law</li>
            </ul>
          </section>

          {/* Limitation of Liability */}
          <section id="limitation-liability" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.section8')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, ISACAR AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS 
              SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, 
              INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF OR RELATED TO 
              YOUR USE OF THE SERVICE.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICE 
              SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM, OR $100, WHICHEVER 
              IS GREATER.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF LIABILITY FOR CONSEQUENTIAL OR 
              INCIDENTAL DAMAGES. IN SUCH JURISDICTIONS, OUR LIABILITY SHALL BE LIMITED TO THE MAXIMUM EXTENT 
              PERMITTED BY LAW.
            </p>
          </section>

          {/* Warranties */}
          <section id="warranties" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.section9')}</h2>
            
            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">9.1 Service Availability</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              While we strive to provide a reliable service with 99.9% uptime, we do not guarantee that the Service 
              will be uninterrupted, timely, secure, or error-free. We reserve the right to perform scheduled 
              maintenance and updates.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">9.2 Disclaimer of Warranties</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, 
              EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR 
              A PARTICULAR PURPOSE, TITLE, OR NON-INFRINGEMENT.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              WE DO NOT WARRANT THAT THE SERVICE WILL MEET YOUR REQUIREMENTS, THAT IT WILL BE ERROR-FREE, OR 
              THAT ANY DEFECTS WILL BE CORRECTED.
            </p>
          </section>

          {/* Modifications */}
          <section id="modifications" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.section10')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We reserve the right to modify these Terms at any time. If we make material changes, we will notify 
              you by email or through the Service at least 30 days before the changes take effect. Your continued 
              use of the Service after the changes become effective constitutes your acceptance of the modified Terms.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              If you do not agree to the modified Terms, you must stop using the Service and may cancel your account.
            </p>
          </section>

          {/* Termination */}
          <section id="termination" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.section11')}</h2>
            
            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">11.1 Termination by You</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You may terminate your account at any time through your account settings or by contacting us. 
              Upon termination, you will lose access to your account and all associated data.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">11.2 Termination by ISACAR</h3>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We may suspend or terminate your account and access to the Service at our sole discretion, without 
              notice, for any reason, including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Violation of these Terms</li>
              <li>Fraudulent, abusive, or illegal activity</li>
              <li>Non-payment of fees</li>
              <li>Extended period of inactivity</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">11.3 Effect of Termination</h3>
            <p className="text-muted-foreground leading-relaxed">
              Upon termination, your right to use the Service will immediately cease. We may delete your User Content 
              in accordance with our data retention policy. Provisions of these Terms that by their nature should 
              survive termination will remain in effect.
            </p>
          </section>

          {/* Disputes */}
          <section id="disputes" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.section12')}</h2>
            
            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">12.1 Governing Law</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              These Terms shall be governed by and construed in accordance with the laws of [Jurisdiction], 
              without regard to its conflict of law provisions.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">12.2 Dispute Resolution</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              In the event of any dispute arising out of or relating to these Terms or the Service, you agree to 
              first contact us to attempt to resolve the dispute informally. If we cannot resolve the dispute within 
              30 days, either party may pursue formal legal action.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">12.3 Jurisdiction</h3>
            <p className="text-muted-foreground leading-relaxed">
              You agree to submit to the personal jurisdiction of the courts located in [Jurisdiction] for the 
              purpose of litigating all such claims or disputes.
            </p>
          </section>

          {/* General */}
          <section id="general" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.section13')}</h2>
            
            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">13.1 Entire Agreement</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and ISACAR 
              regarding the Service and supersede all prior agreements and understandings.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">13.2 Assignment</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You may not assign or transfer these Terms or your rights and obligations without our prior written 
              consent. We may assign these Terms without restriction.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">13.3 Severability</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If any provision of these Terms is held to be invalid or unenforceable, that provision shall be limited 
              or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force 
              and effect.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">13.4 Waiver</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Our failure to enforce any right or provision of these Terms shall not constitute a waiver of such 
              right or provision.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">13.5 Force Majeure</h3>
            <p className="text-muted-foreground leading-relaxed">
              We shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable 
              control, including acts of God, war, terrorism, riots, embargoes, acts of civil or military authorities, 
              fire, floods, accidents, pandemics, strikes, or shortages of transportation facilities, fuel, energy, 
              labor, or materials.
            </p>
          </section>

          {/* Contact */}
          <section id="contact" className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-foreground mb-4">{t('terms.section14')}</h2>
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
