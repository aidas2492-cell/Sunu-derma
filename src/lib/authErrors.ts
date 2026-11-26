// Traduit les erreurs de Supabase Auth en messages clairs, en français.
// Supabase renvoie un "code" (versions récentes) et/ou un message en anglais.
const BY_CODE: Record<string, string> = {
  invalid_credentials: "Email ou mot de passe incorrect.",
  email_not_confirmed: "Votre email n'est pas encore confirmé. Ouvrez le lien reçu par email.",
  user_already_exists: "Un compte existe déjà avec cet email. Connectez-vous ou utilisez « Mot de passe oublié ».",
  email_exists: "Un compte existe déjà avec cet email. Connectez-vous ou utilisez « Mot de passe oublié ».",
  weak_password: "Mot de passe trop faible : utilisez au moins 8 caractères.",
  same_password: "Le nouveau mot de passe doit être différent de l'ancien.",
  over_request_rate_limit: "Trop de tentatives. Patientez quelques minutes puis réessayez.",
  over_email_send_rate_limit: "Trop d'emails envoyés. Patientez quelques minutes puis réessayez.",
  email_address_invalid: "Cette adresse email n'est pas valide.",
  validation_failed: "Vérifiez les informations saisies.",
  otp_expired: "Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau.",
  session_not_found: "Votre session a expiré. Reconnectez-vous.",
};

const BY_MESSAGE: [RegExp, string][] = [
  [/invalid login credentials/i, BY_CODE.invalid_credentials],
  [/email not confirmed/i, BY_CODE.email_not_confirmed],
  [/already registered|already exists/i, BY_CODE.user_already_exists],
  [/password should be at least|weak password/i, BY_CODE.weak_password],
  [/different from the old password/i, BY_CODE.same_password],
  [/rate limit|too many requests|for security purposes/i, BY_CODE.over_request_rate_limit],
  [/invalid email|unable to validate email/i, BY_CODE.email_address_invalid],
  [/expired|invalid.*(token|link)/i, BY_CODE.otp_expired],
  [/failed to fetch|network/i, "Connexion internet impossible. Vérifiez votre réseau et réessayez."],
];

export function authErrorMessage(err: unknown): string {
  const e = err as { code?: string; message?: string } | null;
  if (e?.code && BY_CODE[e.code]) return BY_CODE[e.code];
  const msg = e?.message ?? "";
  for (const [re, fr] of BY_MESSAGE) if (re.test(msg)) return fr;
  return "Une erreur est survenue. Réessayez dans un instant.";
}
