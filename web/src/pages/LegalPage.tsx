import { Link } from 'react-router';
import { Cartouche } from '../components/Cartouche.tsx';
import { PageLayout } from '../layout/PageLayout.tsx';

/**
 * Mentions légales + confidentialité (RGPD).
 * Les passages entre [crochets] sont à compléter par l'association avant la mise en ligne.
 */
export function LegalPage() {
  return (
    <PageLayout title="Mentions légales">
      <div className="legal">
        <Cartouche title="Éditeur du site">
          <p>
            Mortauxrats.fr est édité par l’association <strong>Mort aux Rats</strong> [forme juridique, n° RNA ou SIREN], dont le siège
            est situé [adresse].
          </p>
          <p>Directeur·ice de la publication : [nom].</p>
          <p>Contact : [adresse email de contact].</p>
        </Cartouche>

        <Cartouche title="Hébergement">
          <p>
            Le site, sa base de données et les fichiers envoyés sont hébergés par Railway Corporation, 548 Market St PMB 68956,
            San Francisco, CA 94104, États-Unis — railway.com. [Adresse et région des serveurs à vérifier dans le tableau de bord
            Railway.]
          </p>
        </Cartouche>

        <Cartouche title="Contenus publiés">
          <p>
            Les articles et commentaires sont publiés sous la responsabilité de leurs auteur·ices, qui gardent leurs droits sur leurs
            textes et images. Pour signaler un contenu : [adresse email de contact].
          </p>
        </Cartouche>

        <Cartouche title="Données personnelles">
          <p>Le site ne collecte que ce qu’il faut pour fonctionner. Pas de publicité, pas de statistiques de visite, pas de traceur.</p>
          <p>
            <strong>Si tu crées un compte</strong> : ton email (pour te connecter, jamais affiché), ton pseudo et ton avatar
            (publics), ton mot de passe (chiffré, illisible même pour nous), tes articles, commentaires, réactions et ton sac. Quand
            tu es connecté·e, ton pseudo apparaît dans le widget « En ligne ».
          </p>
          <p>
            <strong>Pourquoi</strong> : faire fonctionner ton compte et le blog (base légale : l’exécution du service que tu
            utilises). Rien n’est vendu ni transmis à des tiers, à part l’hébergeur.
          </p>
          <p>
            <strong>Combien de temps</strong> : tant que ton compte existe. Les sessions de connexion expirent après 7 jours sans
            visite (30 jours au maximum).
          </p>
          <p>
            <strong>Tes droits</strong> : tu peux modifier ton pseudo et ton avatar, et supprimer ton compte avec tout son contenu
            depuis <Link to="/compte">Mon compte</Link>. Pour toute autre demande (accès, rectification, opposition) :
            [adresse email de contact]. Tu peux aussi saisir la CNIL (cnil.fr).
          </p>
        </Cartouche>

        <Cartouche title="Cookies et stockage">
          <p>Uniquement ce qui est nécessaire au site, donc pas de bandeau de consentement :</p>
          <ul>
            <li>
              <code>__Host-sid</code> : ta session de connexion (jusqu’à 30 jours).
            </li>
            <li>
              <code>__Host-mar_voter</code> : se souvenir de ta réaction sur un article quand tu n’es pas connecté·e (1 an). Créé
              seulement si tu réagis.
            </li>
            <li>Stockage local du navigateur : la disposition de tes widgets et le compteur d’affection du rat. Rien n’est envoyé au serveur.</li>
          </ul>
          <p>
            Les vidéos YouTube ne sont chargées que si tu cliques dessus (mode « confidentialité renforcée »). À ce moment-là,
            YouTube (Google) reçoit ta visite et applique sa propre politique de confidentialité.
          </p>
        </Cartouche>

        <Cartouche title="Crédits">
          <p>Police Pixelify Sans (SIL Open Font License). Éditeur de texte : TipTap (MIT).</p>
        </Cartouche>
      </div>
    </PageLayout>
  );
}
