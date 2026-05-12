import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/shared/ui/kit/input";
import { Button } from "@/shared/ui/kit/button";
import { useModelQuery } from "@/features/model-data/hooks/useModelQuery";
import { toast } from "sonner";
import { CheckInventoryLineModal } from "./CheckInventoryLineModal";

interface InventoryScannerProps {
  campaignId: string;
}

export function InventoryScanner({ campaignId }: InventoryScannerProps) {
  const [code, setCode] = useState("");
  const [scannedLineId, setScannedLineId] = useState<string | null>(null);

  // We need to fetch the line lazily or fetch when code is submitted
  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    try {
      const response = await fetch('/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          query: `
            query findLine($campaignId: ID!, $code: String!) {
              inventoryLineList(
                where: { 
                  campaign: { id: { eq: $campaignId } },
                  asset: { inventoryCode: { eq: $code } } 
                }
              ) {
                items {
                  id
                }
              }
            }
          `,
          variables: { campaignId, code: code.trim() }
        })
      });

      const { data } = await response.json();
      const lines = data?.inventoryLineList?.items || [];
      
      if (lines.length > 0) {
        setScannedLineId(lines[0].id);
      } else {
        toast.error("Code non trouvé dans cette campagne");
      }
    } catch (error) {
      toast.error("Erreur lors de la recherche");
    }
  };

  return (
    <>
      <form onSubmit={handleScan} className="flex gap-2 w-full max-w-sm mb-4">
        <Input 
          placeholder="Code inventaire ou scan..." 
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="flex-1"
        />
        <Button type="submit">
          <Search className="w-4 h-4 mr-2" />
          Chercher
        </Button>
      </form>

      {scannedLineId && (
        <CheckInventoryLineModal
          lineId={scannedLineId}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setScannedLineId(null);
              setCode("");
            }
          }}
        />
      )}
    </>
  );
}
