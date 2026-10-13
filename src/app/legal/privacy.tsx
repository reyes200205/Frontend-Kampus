import { LegalDocumentView } from "@/components/legal/legal-document-view";
import { PrivacyNotice } from "@/constants/legal";

export default function PrivacyScreen() {
  return <LegalDocumentView document={PrivacyNotice} />;
}
