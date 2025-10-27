UPDATE "complejos"
SET 
  "otb" = COALESCE("otb", 'OTB'),
  "subalcaldia" = COALESCE("subalcaldia", 'Cercado'),
  "celular" = COALESCE("celular", '70000000'),
  "precioDiurnoPorHora" = COALESCE("precioDiurnoPorHora", 0),
  "precioNocturnoPorHora" = COALESCE("precioNocturnoPorHora", 0)
WHERE "otb" IS NULL 
   OR "subalcaldia" IS NULL 
   OR "celular" IS NULL 
   OR "precioDiurnoPorHora" IS NULL 
   OR "precioNocturnoPorHora" IS NULL;
