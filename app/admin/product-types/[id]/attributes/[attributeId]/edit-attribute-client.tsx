"use client";

import { AttributeForm } from "../../../components/attribute-form";
import { ProductTypeAttribute } from "@prisma/client";

interface EditAttributeClientProps {
    initialData: ProductTypeAttribute;
    productTypeId: string;
    attributeId: string;
}

export function EditAttributeClient({ initialData, productTypeId }: EditAttributeClientProps) {
    return (
        <AttributeForm
            productTypeId={productTypeId}
            attribute={initialData}
        />
    );
} 