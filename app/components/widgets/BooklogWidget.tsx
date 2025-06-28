import BooklogIcon from "@/app/components/icons/BooklogIcon";
import BaseWidget from "./BaseWidget";
import { config } from "@/app/lib/config";

export default function BooklogWidget() {
    return (
        <BaseWidget
            title="ブクログ"
            icon={<BooklogIcon />}
            link={config.profiles.booklog.url}
            username={config.profiles.booklog.username}
            colorScheme="amber"
        />
    );
}