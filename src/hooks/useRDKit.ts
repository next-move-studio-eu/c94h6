/**
 * Hook to get the RDKit module for SMILES rendering.
 * Requires RDKit_minimal.js to be loaded (e.g. via script in index.html).
 */
import { useState, useEffect, useRef } from 'react';

declare global {
  interface Window {
    initRDKitModule?: () => Promise<IRDKit>;
    RDKit?: IRDKit;
  }
}

export interface IRDKit {
  get_mol(smiles: string): IRDMol | null;
  version?: () => string;
}

export interface IRDMol {
  get_svg(): string;
  get_svg_with_highlights?(details: string): string;
}

export function useRDKit(): { rdkit: IRDKit | null; ready: boolean; error: Error | null } {
  const [rdkit, setRdkit] = useState<IRDKit | null>(typeof window !== 'undefined' ? window.RDKit ?? null : null);
  const [error, setError] = useState<Error | null>(null);
  const initStarted = useRef(false);

  useEffect(() => {
    if (initStarted.current) return;
    if (window.RDKit) {
      setRdkit(window.RDKit);
      return;
    }
    if (typeof window.initRDKitModule !== 'function') {
      setError(new Error('RDKit script not loaded'));
      return;
    }
    initStarted.current = true;
    window
      .initRDKitModule()
      .then((R) => {
        window.RDKit = R;
        setRdkit(R);
      })
      .catch((e) => {
        setError(e instanceof Error ? e : new Error(String(e)));
      });
  }, []);

  return {
    rdkit,
    ready: rdkit != null,
    error: error ?? null,
  };
}
