export interface TypingLocation {
  name: string;
  code?: string;
  address?: string;
  isActive?: boolean;
}

export interface TypingEmployee {
  name?: string;
}

export interface TypingAssetSummary {
  name: string;
  brand?: string;
}

export interface TypingAssetMovement {
  id?: string | number;
  status?: string;
  movementDate?: string;
  reference?: string;
  reason?: string;
  asset: TypingAssetSummary;
  fromEmployee?: TypingEmployee;
  toLocation?: TypingLocation;
}
