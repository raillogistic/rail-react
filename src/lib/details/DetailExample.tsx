import * as React from "react";
import {} from "lucide-react";

import { Badge } from "@/lib/components/ui/badge";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { Input } from "@/lib/components/ui/input";
import { ModelDetailV2 } from "./v2";

export default function DetailExample() {
  const [orderIdDraft, setOrderIdDraft] = React.useState("1");
  const [orderId, setOrderId] = React.useState("1");

  const loadOrderDetail = React.useCallback(() => {
    const nextId = orderIdDraft.trim();
    if (!nextId) return;
    setOrderId(nextId);
  }, [orderIdDraft]);

  return (
    <div className="space-y-4 p-4">
      <Card className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">store.Order Detail</h2>
            <p className="text-xs text-muted-foreground">
              Live metadata-driven detail view wired to
              <code className="ml-1">rail_backend.apps.store.models.Order</code>
              .
            </p>
          </div>
          <Badge variant="secondary">Model: store.Order</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={orderIdDraft}
            onChange={(event) => setOrderIdDraft(event.target.value)}
            placeholder="Order ID"
            className="w-full max-w-[220px]"
          />
          <Button onClick={loadOrderDetail} type="button">
            Load Order
          </Button>
          <Badge variant="outline">Current ID: {orderId}</Badge>
        </div>
      </Card>

      <ModelDetailV2
        customization={{
          modelFields: ["sku"],
        }}
        appName="store"
        modelName="Product"
        id={orderId}
      />
    </div>
  );
}
