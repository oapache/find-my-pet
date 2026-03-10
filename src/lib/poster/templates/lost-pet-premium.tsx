import { Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer";
import type { PosterData } from "./lost-pet-basic";

Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiA.woff2",
      fontWeight: 700,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiA.woff2",
      fontWeight: 900,
    },
  ],
});

const colors = {
  primary: "#7c3aed",
  primaryDark: "#5b21b6",
  accent: "#f59e0b",
  bg: "#faf5ff",
  text: "#1e1b4b",
  textMuted: "#6b7280",
  badge: "#ede9fe",
  alert: "#fef3c7",
  alertText: "#78350f",
};

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: "Inter",
    backgroundColor: colors.bg,
  },
  headerBand: {
    backgroundColor: colors.primary,
    padding: 24,
    alignItems: "center",
    position: "relative",
  },
  headerDecorTop: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 120,
    height: 120,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderBottomLeftRadius: 120,
  },
  headerDecorBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 80,
    height: 80,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderTopRightRadius: 80,
  },
  headerTitle: {
    fontSize: 38,
    fontWeight: 900,
    color: "#ffffff",
    letterSpacing: 3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    marginTop: 6,
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  body: {
    padding: 30,
  },
  photoRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  photoWrapper: {
    width: 200,
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
    border: `4px solid ${colors.primary}`,
  },
  photo: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  infoSide: {
    flex: 1,
    paddingLeft: 24,
    justifyContent: "center",
  },
  petName: {
    fontSize: 30,
    fontWeight: 900,
    color: colors.text,
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: colors.badge,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 10,
    color: colors.primaryDark,
    fontWeight: 700,
  },
  divider: {
    height: 2,
    backgroundColor: colors.primary,
    opacity: 0.15,
    marginVertical: 16,
    borderRadius: 1,
  },
  descBox: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeft: `4px solid ${colors.primary}`,
  },
  descText: {
    fontSize: 11,
    color: colors.text,
    lineHeight: 1.6,
  },
  lastSeenBox: {
    backgroundColor: colors.alert,
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  lastSeenIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  lastSeenContent: {
    flex: 1,
  },
  lastSeenLabel: {
    fontSize: 9,
    color: colors.alertText,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  lastSeenValue: {
    fontSize: 14,
    color: colors.alertText,
    fontWeight: 700,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: "auto",
  },
  contactBox: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginRight: 16,
  },
  contactLabel: {
    fontSize: 9,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  contactPhone: {
    fontSize: 22,
    fontWeight: 900,
    color: colors.primary,
  },
  contactName: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  qrBox: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 12,
  },
  qrImage: {
    width: 110,
    height: 110,
  },
  qrLabel: {
    fontSize: 8,
    color: colors.textMuted,
    marginTop: 6,
    textAlign: "center",
  },
  footer: {
    backgroundColor: colors.primaryDark,
    padding: 10,
    alignItems: "center",
  },
  footerText: {
    fontSize: 9,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1,
  },
});

export function LostPetPremium({ pet, photoBase64, qrCodeBase64, contact, locale }: PosterData) {
  const isPtBR = locale === "pt-BR";

  const labels = {
    title: isPtBR ? "PET PERDIDO" : "LOST PET",
    subtitle: isPtBR ? "Ajude-nos a encontrá-lo" : "Help us find them",
    lastSeen: isPtBR ? "ÚLTIMA LOCALIZAÇÃO" : "LAST SEEN",
    contact: isPtBR ? "CONTATO" : "CONTACT",
    scanQR: isPtBR ? "Escaneie para\nmais informações" : "Scan for\nmore info",
    species: {
      dog: isPtBR ? "Cachorro" : "Dog",
      cat: isPtBR ? "Gato" : "Cat",
      bird: isPtBR ? "Pássaro" : "Bird",
      other: isPtBR ? "Outro" : "Other",
    } as Record<string, string>,
    size: {
      small: isPtBR ? "Pequeno" : "Small",
      medium: isPtBR ? "Médio" : "Medium",
      large: isPtBR ? "Grande" : "Large",
    } as Record<string, string>,
    gender: {
      male: isPtBR ? "Macho" : "Male",
      female: isPtBR ? "Fêmea" : "Female",
    } as Record<string, string>,
  };

  const details: string[] = [];
  details.push(labels.species[pet.species] || pet.species);
  if (pet.breed) details.push(pet.breed);
  if (pet.color) details.push(pet.color);
  if (pet.size) details.push(labels.size[pet.size] || pet.size);
  if (pet.gender && pet.gender !== "unknown")
    details.push(labels.gender[pet.gender] || pet.gender);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Decorative Header */}
        <View style={styles.headerBand}>
          <View style={styles.headerDecorTop} />
          <View style={styles.headerDecorBottom} />
          <Text style={styles.headerTitle}>{labels.title}</Text>
          <Text style={styles.headerSubtitle}>{labels.subtitle}</Text>
        </View>

        {/* Body */}
        <View style={styles.body}>
          {/* Photo + Name row */}
          <View style={styles.photoRow}>
            {photoBase64 && (
              <View style={styles.photoWrapper}>
                <Image src={photoBase64} style={styles.photo} />
              </View>
            )}
            <View style={styles.infoSide}>
              <Text style={styles.petName}>{pet.name}</Text>
              <View style={styles.badgeRow}>
                {details.map((detail, i) => (
                  <View key={i} style={styles.badge}>
                    <Text style={styles.badgeText}>{detail}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Description */}
          {pet.description && (
            <View style={styles.descBox}>
              <Text style={styles.descText}>{pet.description}</Text>
            </View>
          )}

          {/* Last Seen */}
          {pet.lastSeenLocation && (
            <View style={styles.lastSeenBox}>
              <View style={styles.lastSeenContent}>
                <Text style={styles.lastSeenLabel}>{labels.lastSeen}</Text>
                <Text style={styles.lastSeenValue}>{pet.lastSeenLocation}</Text>
              </View>
            </View>
          )}

          {/* Contact + QR */}
          <View style={styles.bottomRow}>
            <View style={styles.contactBox}>
              <Text style={styles.contactLabel}>{labels.contact}</Text>
              {contact.phone && (
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              )}
              <Text style={styles.contactName}>{contact.name}</Text>
            </View>

            {qrCodeBase64 && (
              <View style={styles.qrBox}>
                <Image src={qrCodeBase64} style={styles.qrImage} />
                <Text style={styles.qrLabel}>{labels.scanQR}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>findmypet.com.br</Text>
        </View>
      </Page>
    </Document>
  );
}
