import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoanConditionalFieldsProps {
  secondaryStatus: string;
  loanDate: string;
  setLoanDate: (v: string) => void;
  borrowerName: string;
  setBorrowerName: (v: string) => void;
  borrowDate: string;
  setBorrowDate: (v: string) => void;
  returnDate: string;
  setReturnDate: (v: string) => void;
  lenderName: string;
  setLenderName: (v: string) => void;
}

export function LoanConditionalFields({
  secondaryStatus,
  loanDate, setLoanDate,
  borrowerName, setBorrowerName,
  borrowDate, setBorrowDate,
  returnDate, setReturnDate,
  lenderName, setLenderName,
}: LoanConditionalFieldsProps) {
  if (secondaryStatus === "Prêté") {
    return (
      <div className="grid grid-cols-2 gap-3 animate-fade-in">
        <div className="space-y-1">
          <Label className="text-xs">Date de prêt</Label>
          <Input
            type="date"
            value={loanDate}
            onChange={(e) => setLoanDate(e.target.value)}
            placeholder="Date de prêt"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Identité de l'emprunteur</Label>
          <Input
            value={borrowerName}
            onChange={(e) => setBorrowerName(e.target.value)}
            placeholder="Nom de l'emprunteur"
          />
        </div>
      </div>
    );
  }

  if (secondaryStatus === "Emprunté") {
    return (
      <div className="grid grid-cols-3 gap-3 animate-fade-in">
        <div className="space-y-1">
          <Label className="text-xs">Date d'emprunt</Label>
          <Input
            type="date"
            value={borrowDate}
            onChange={(e) => setBorrowDate(e.target.value)}
            placeholder="Date d'emprunt"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Date de restitution</Label>
          <Input
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            placeholder="Date de restitution"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Identité du prêteur</Label>
          <Input
            value={lenderName}
            onChange={(e) => setLenderName(e.target.value)}
            placeholder="Nom du prêteur ou établissement"
          />
        </div>
      </div>
    );
  }

  return null;
}
