import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Política de Privacitat</CardTitle>
            <p className="text-sm text-muted-foreground">Última actualització: Agost 2026</p>
          </CardHeader>
          <CardContent className="space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="mb-2 text-lg font-semibold">1. Responsable del tractament</h2>
              <p>
                La Colla Gegantera de Torelló és la responsable del tractament de les dades personals
                dels usuaris de l'aplicació. Per a qualsevol consulta, podeu contactar-nos a través
                del correu electrònic de l'associació.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold">2. Dades que recollim</h2>
              <p>Recollim les següents dades personals durant el procés de registre i ús de l'aplicació:</p>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>Nom i cognoms</li>
                <li>Adreça de correu electrònic</li>
                <li>Data de naixement</li>
                <li>Número de telèfon (opcional)</li>
                <li>Fotografia de perfil (opcional)</li>
                <li>Dades d'assistència a esdeveniments i activitats</li>
                <li>Preferències de notificacions</li>
                <li>Pertinença a família dins de l'associació</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold">3. Finalitat del tractament</h2>
              <p>Les dades personals es tracten amb les següents finalitats:</p>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>Gestió de la inscripció i participació en l'associació</li>
                <li>Organització d'esdeveniments, trobades i assajos</li>
                <li>Envio de notificacions sobre activitats de la colla</li>
                <li>Gestió de la galeria de fotografies</li>
                <li>Comunicacions internes entre membres</li>
                <li>Cumpliment d'obligacions legals de l'associació</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold">4. Base legal del tractament</h2>
              <p>
                El tractament de les vostres dades es basa en el consentiment explícit que ens
                doneu en registrar-vos a l'aplicació, d'acord amb l'article 6.1.a del Reglament
                General de Protecció de Dades (RGPD) i l'article 7 de la Llei Orgànica
                3/2018, de 5 de desembre, de Protecció de Dades Personals i Garantia dels
                Drets Digitals (LOPDGDD).
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold">5. Conservació de les dades</h2>
              <p>
                Les vostres dades personals es conservaran mentre sigueu membre actiu de
                l'associació. En cas de baixa, les dades seran eliminades en un termini màxim
                de 30 dies, llevat que existeixi una obligació legal de conservar-les.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold">6. Drets dels usuaris</h2>
              <p>D'acord amb el RGPD i la LOPDGDD, teniu dret a:</p>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li><strong>Accés:</strong> conèixer quines dades personals tenim sobre vostè.</li>
                <li><strong>Rectificació:</strong> sol·licitar la correcció de dades inexactes.</li>
                <li><strong>Supressió:</strong> sol·licitar l'eliminació de les vostres dades.</li>
                <li><strong>Limitació:</strong> sol·licitar la limitació del tractament.</li>
                <li><strong>Portabilitat:</strong> rebre les vostres dades en un format estructurat.</li>
                <li><strong>Oposició:</strong> oposar-vos al tractament de les vostres dades.</li>
                <li><strong>Revocació del consentiment:</strong> en qualsevol moment, sense
                  que això afecti la licitud del tractament basat en el consentiment previ.</li>
              </ul>
              <p className="mt-2">
                Per exercir aquests drets, podeu contactar-nos a través del correu electrònic
                de l'associació.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold">7. Seguretat de les dades</h2>
              <p>
                Adoptem les mesures tècniques i organitzatives necessàries per garantir la
                seguretat de les vostres dades personals i evitar la seva alteració, pèrdua,
                tractament o accés no autoritzat, tenint en compte l'estat de la tecnologia,
                la naturalesa de les dades i els riscos.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold">8. Menors d'edat</h2>
              <p>
                L'aplicació no està dirigida a menors de 14 anys. En el cas de menors de 14 anys,
                serà necessari el consentiment dels pares o tutors legals per al tractament de
                les seves dades personals.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-lg font-semibold">9. Canvis en la política de privacitat</h2>
              <p>
                Ens reservem el dret de modificar aquesta política de privacitat. Qualsevol canvi
                serà comunicat a través de l'aplicació o per correu electrònic.
              </p>
            </section>
          </CardContent>
        </Card>
        <div className="mt-6 text-center">
          <Link to="/register" className="text-sm text-primary underline-offset-4 hover:underline">
            ← Tornar al registre
          </Link>
        </div>
      </div>
    </div>
  )
}
