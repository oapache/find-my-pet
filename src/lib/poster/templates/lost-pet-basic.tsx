import { Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer";

// Register a system font fallback
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

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Inter",
    backgroundColor: "#ffffff",
  },
  header: {
    backgroundColor: "#dc2626",
    padding: 20,
    marginHorizontal: -30,
    marginTop: -30,
    marginBottom: 20,
    alignItems: "center",
  },
  headerText: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: 900,
    letterSpacing: 2,
    textAlign: "center",
  },
  headerSubtext: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 400,
    marginTop: 6,
    textAlign: "center",
  },
  photoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  photo: {
    width: 280,
    height: 280,
    objectFit: "cover",
    borderRadius: 12,
    border: "3px solid #dc2626",
  },
  petName: {
    fontSize: 32,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 8,
    color: "#0f172a",
  },
  detailsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  detailBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    margin: 4,
  },
  detailText: {
    fontSize: 12,
    color: "#475569",
  },
  descriptionContainer: {
    backgroundColor: "#fef2f2",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 11,
    color: "#374151",
    lineHeight: 1.5,
    textAlign: "center",
  },
  lastSeenContainer: {
    backgroundColor: "#fef3c7",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "center",
  },
  lastSeenLabel: {
    fontSize: 10,
    color: "#92400e",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  lastSeenText: {
    fontSize: 13,
    color: "#78350f",
    marginTop: 4,
    fontWeight: 700,
  },
  bottomSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
  },
  contactContainer: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 10,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 24,
    fontWeight: 700,
    color: "#0f172a",
  },
  contactName: {
    fontSize: 12,
    color: "#475569",
    marginTop: 2,
  },
  qrContainer: {
    alignItems: "center",
  },
  qrImage: {
    width: 120,
    height: 120,
  },
  qrLabel: {
    fontSize: 8,
    color: "#94a3b8",
    marginTop: 4,
    textAlign: "center",
  },
  footer: {
    borderTop: "1px solid #e2e8f0",
    marginTop: 16,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: 9,
    color: "#94a3b8",
  },
});

export interface PosterData {
  pet: {
    name: string;
    species: string;
    breed?: string | null;
    color?: string | null;
    size?: string | null;
    gender?: string | null;
    description?: string | null;
    lastSeenLocation?: string | null;
  };
  photoBase64?: string;
  qrCodeBase64?: string;
  contact: {
    name: string;
    phone?: string | null;
  };
  locale: string;
}

export function LostPetPoster({ pet, photoBase64, qrCodeBase64, contact, locale }: PosterData) {
  const isPtBR = locale === "pt-BR";

  const labels = {
    title: isPtBR ? "PET PERDIDO" : "LOST PET",
    subtitle: isPtBR ? "AJUDE-NOS A ENCONTRAR" : "HELP US FIND",
    lastSeen: isPtBR ? "VISTO POR ÚLTIMO EM" : "LAST SEEN AT",
    contact: isPtBR ? "CONTATO" : "CONTACT",
    scanQR: isPtBR ? "Escaneie para mais informações" : "Scan for more info",
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
        {/* Header Banner */}
        <View style={styles.header}>
          <Text style={styles.headerText}>{labels.title}</Text>
          <Text style={styles.headerSubtext}>{labels.subtitle}</Text>
        </View>

        {/* Pet Photo */}
        {photoBase64 && (
          <View style={styles.photoContainer}>
            <Image src={photoBase64} style={styles.photo} />
          </View>
        )}

        {/* Pet Name */}
        <Text style={styles.petName}>{pet.name}</Text>

        {/* Detail Badges */}
        <View style={styles.detailsContainer}>
          {details.map((detail, i) => (
            <View key={i} style={styles.detailBadge}>
              <Text style={styles.detailText}>{detail}</Text>
            </View>
          ))}
        </View>

        {/* Description */}
        {pet.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>{pet.description}</Text>
          </View>
        )}

        {/* Last Seen */}
        {pet.lastSeenLocation && (
          <View style={styles.lastSeenContainer}>
            <Text style={styles.lastSeenLabel}>{labels.lastSeen}</Text>
            <Text style={styles.lastSeenText}>{pet.lastSeenLocation}</Text>
          </View>
        )}

        {/* Bottom: Contact + QR */}
        <View style={styles.bottomSection}>
          <View style={styles.contactContainer}>
            <Text style={styles.contactLabel}>{labels.contact}</Text>
            {contact.phone && (
              <Text style={styles.contactPhone}>{contact.phone}</Text>
            )}
            <Text style={styles.contactName}>{contact.name}</Text>
          </View>

          {qrCodeBase64 && (
            <View style={styles.qrContainer}>
              <Image src={qrCodeBase64} style={styles.qrImage} />
              <Text style={styles.qrLabel}>{labels.scanQR}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>findmypet.com.br</Text>
        </View>
      </Page>
    </Document>
  );
}
