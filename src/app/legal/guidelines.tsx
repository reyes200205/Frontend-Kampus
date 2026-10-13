import { LegalDocumentView } from "@/components/legal/legal-document-view";
import { CommunityGuidelines } from "@/constants/legal";

export default function GuidelinesScreen() {
  return <LegalDocumentView document={CommunityGuidelines} />;
}
