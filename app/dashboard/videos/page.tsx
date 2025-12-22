import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserVideos } from "@/app/actions/get-user-videos";
import { Video } from "lucide-react";
import Link from "next/link";
import VideoGrid from "./_components/VideoGrid";

export default async function MyVideosPage() {
    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress;

    if (!email) {
        redirect("/sign-in");
    }

    const videos = await getUserVideos(email);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">My Videos</h1>
                    <p className="text-muted-foreground">
                        Manage and download your generated videos
                    </p>
                </div>
                <Link
                    href="/dashboard/manual-video"
                    className="px-4 py-2 bg-brand-primary text-white rounded-lg font-medium hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20 flex items-center gap-2 w-fit"
                >
                    <Video className="w-4 h-4" />
                    Create New Video
                </Link>
            </div>

            <VideoGrid videos={videos} />
        </div>
    );
}
