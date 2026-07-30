import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Política de Privacidade | Fly Crew Experience",
  description: "Política de privacidade e proteção de dados em conformidade com a LGPD.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-executive-black py-16 px-6 sm:px-8 lg:px-12">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-silver-mist hover:text-gold-prestige transition-colors mb-12 text-sm font-montserrat">
          <ArrowLeft size={16} /> Voltar ao site
        </Link>

        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.2em] text-gold-prestige font-semibold">LGPD - LEI 13.709/2018</p>
            <h1 className="text-4xl sm:text-5xl font-cinzel font-light text-white">Política de Privacidade</h1>
            <p className="text-sm text-silver-mist">Última atualização: Maio de 2026</p>
          </div>

          <div className="prose prose-invert max-w-none font-montserrat space-y-6 text-silver-mist text-sm leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-xl font-cinzel font-light text-white">1. Quem somos</h2>
              <p>
                A <strong className="text-white">Fly Crew Experience</strong> é uma empresa de educação premium em aviação, comprometida com a proteção dos dados pessoais de seus visitantes, alunos e contatos, em estrita conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-cinzel font-light text-white">2. Dados coletados</h2>
              <p>Coletamos apenas os dados estritamente necessários:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-white">Formulário de contato:</strong> nome, email, mensagem</li>
                <li><strong className="text-white">Newsletter:</strong> email</li>
                <li><strong className="text-white">Reserva de workshops:</strong> nome, email, telefone, workshop escolhido, data preferida</li>
                <li><strong className="text-white">Dados técnicos:</strong> endereço IP (para segurança), navegador</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-cinzel font-light text-white">3. Finalidade do tratamento</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Responder solicitações de contato</li>
                <li>Enviar comunicações sobre workshops e novidades (newsletter)</li>
                <li>Processar reservas de workshops</li>
                <li>Segurança e prevenção a fraudes</li>
                <li>Cumprimento de obrigações legais</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-cinzel font-light text-white">4. Base legal (Art. 7º LGPD)</h2>
              <p>Tratamos seus dados com base em:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-white">Consentimento</strong> (explícito via checkbox em cada formulário)</li>
                <li><strong className="text-white">Execução de contrato</strong> (quando aplicável)</li>
                <li><strong className="text-white">Legítimo interesse</strong> (segurança, prevenção a fraudes)</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-cinzel font-light text-white">5. Seus direitos (Art. 18 LGPD)</h2>
              <p>Você tem direito a, a qualquer momento, solicitar:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Confirmação da existência de tratamento</li>
                <li>Acesso aos seus dados</li>
                <li>Correção de dados incompletos ou desatualizados</li>
                <li>Anonimização, bloqueio ou eliminação de dados</li>
                <li>Portabilidade dos dados</li>
                <li>Eliminação dos dados tratados com base em consentimento</li>
                <li>Revogação do consentimento</li>
              </ul>
              <p>Para exercer seus direitos, envie email para <a href="mailto:flycrewexperience@gmail.com" className="text-gold-prestige underline">flycrewexperience@gmail.com</a>.</p>
            </section>

            <section className="space-y-3">dpo@
              <h2 className="text-xl font-cinzel font-light text-white">6. Segurança</h2>
              <p>
                Adotamos medidas técnicas e organizacionais robustas: criptografia em trânsito (HTTPS/TLS), armazenamento seguro em banco de dados PostgreSQL (Neon), autenticação multifator para administradores, proteção contra brute-force, e auditoria de acessos.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-cinzel font-light text-white">7. Compartilhamento</h2>
              <p>
                <strong className="text-white">Não vendemos seus dados.</strong> Compartilhamos apenas com prestadores de serviço essenciais (hospedagem, email marketing) sob contratos de confidencialidade, e com autoridades quando exigido por lei.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-cinzel font-light text-white">8. Retenção</h2>
              <p>
                Mantemos seus dados pelo tempo necessário para as finalidades descritas ou conforme exigido por lei. Você pode solicitar a exclusão a qualquer momento.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-cinzel font-light text-white">9. Cookies</h2>
              <p>
                Usamos cookies essenciais para o funcionamento do site (sessão, autenticação). Você pode gerenciar suas preferências no banner exibido ao acessar o site.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-cinzel font-light text-white">10. Contato do Encarregado (DPO)</h2>
              <p>
                Encarregado pelo tratamento de dados pessoais:<br />
                Email: <a href="mailto:flycrewexperience@gmail.com" className="text-gold-prestige underline">flycrewexperience@gmail.com</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
