import React from "react";
import {
 Braces,
 Calendar,
 Hash,
 Link2,
 ToggleLeft,
 Type,
} from "lucide-react";

export const FieldTypeIcon: React.FC<{ type: string }> = ({ type }) => {
 const iconClass = "h-3.5 w-3.5 text-muted-foreground";

 switch (type) {
 case "String":
 return <Type className={iconClass} />;
 case "Number":
 return <Hash className={iconClass} />;
 case "Boolean":
 return <ToggleLeft className={iconClass} />;
 case "Date":
 case "DateTime":
 return <Calendar className={iconClass} />;
 case "JSON":
 return <Braces className={iconClass} />;
 case "Relationship":
 return <Link2 className={iconClass} />;
 default:
 return null;
 }
};

export default FieldTypeIcon;
