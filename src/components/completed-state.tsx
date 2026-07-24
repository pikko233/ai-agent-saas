import { MeetingGetOne } from "@/modules/meetings/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import {
  BookOpenTextIcon,
  ClockFadingIcon,
  FileTextIcon,
  FileVideoIcon,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import { GeneratedAvatar } from "./generated-avatar";
import { format } from "date-fns";
import { Badge } from "./ui/badge";
import { formatDuration } from "@/lib/utils";
import Markdown from "react-markdown";

interface Props {
  data: MeetingGetOne;
}

export const CompletedState = ({ data }: Props) => {
  return (
    <div className="flex flex-col gap-y-4">
      <Tabs defaultValue="summary">
        <div className="bg-white rounded-lg border px-3 py-2">
          <ScrollArea>
            <TabsList className="p-0 bg-background justify-start rounded-none h-13">
              <TabsTrigger
                value="summary"
                className="text-muted-foreground rounded-none bg-background border-b-2 border-transparent data-active:shadow-none data-active:border-b-primary data-active:text-accent-foreground h-full hover:text-accent-foreground"
              >
                <BookOpenTextIcon />
                总结
              </TabsTrigger>
              <TabsTrigger
                value="transcript"
                className="text-muted-foreground rounded-none bg-background border-b-2 border-transparent data-active:shadow-none data-active:border-b-primary data-active:text-accent-foreground h-full hover:text-accent-foreground"
              >
                <FileTextIcon />
                转录
              </TabsTrigger>
              <TabsTrigger
                value="recoding"
                className="text-muted-foreground rounded-none bg-background border-b-2 border-transparent data-active:shadow-none data-active:border-b-primary data-active:text-accent-foreground h-full hover:text-accent-foreground"
              >
                <FileVideoIcon />
                录像
              </TabsTrigger>
              <TabsTrigger
                value="chat"
                className="text-muted-foreground rounded-none bg-background border-b-2 border-transparent data-active:shadow-none data-active:border-b-primary data-active:text-accent-foreground h-full hover:text-accent-foreground"
              >
                <SparklesIcon />
                问AI
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        <TabsContent value="recoding">
          <div className="bg-white rounded-lg border px-4 py-5">
            <video
              src={data.recordingUrl!}
              className="w-full rounded-lg"
              controls
            />
          </div>
        </TabsContent>
        <TabsContent value="summary">
          <div className="bg-white rounded-lg border">
            <div className="flex flex-col gap-y-4 col-span-5 px-4 py-5">
              {/* 会议名称 */}
              <h2 className="text-2xl font-medium capitalize">{data.name}</h2>
              {/* agent名称 */}
              <div className="flex items-center gap-x-2">
                <Link
                  href={`/agents/${data.agent.id}`}
                  className="flex items-center gap-x-2 underline underline-offset-4 capitalize hover:text-primary"
                >
                  <GeneratedAvatar
                    seed={data.agent.name}
                    variant="botttsNeutral"
                    className="size-5"
                  />
                  {data.agent.name}
                </Link>{" "}
                <p>
                  {data.startedAt
                    ? format(data.startedAt, "yyyy年M月dd日")
                    : ""}
                </p>
              </div>
              {/* AI总结 */}
              <div className="flex items-center gap-x-2">
                <SparklesIcon className="size-4" />
                <p>AI总结</p>
              </div>
              {/* 通话时长 */}
              <Badge
                variant="outline"
                className="flex items-center gap-x-2 [&>svg]:size-4"
              >
                <ClockFadingIcon className="text-blue-700" />
                {data.duration ? formatDuration(data.duration) : "暂无时长"}
              </Badge>
              {/* 总结内容 */}
              <div>
                <Markdown
                  components={{
                    h1: (props) => (
                      <h1 className="text-2xl font-medium mb-6" {...props} />
                    ),
                    h2: (props) => (
                      <h2 className="text-xl font-medium mb-6" {...props} />
                    ),
                    h3: (props) => (
                      <h3 className="text-lg font-medium mb-6" {...props} />
                    ),
                    h4: (props) => (
                      <h4 className="text-base font-medium mb-6" {...props} />
                    ),
                    p: (props) => (
                      <p className="mb-6 leading-relaxed" {...props} />
                    ),
                    ul: (props) => (
                      <ul className="list-disc list-inside mb-6" {...props} />
                    ),
                    li: (props) => <li className="mb-1" {...props} />,
                    strong: (props) => (
                      <strong className="font-semibold" {...props} />
                    ),
                    code: (props) => (
                      <code
                        className="bg-gray-100 px-1 py-0.5 rounded"
                        {...props}
                      />
                    ),
                  }}
                >
                  {data.summary}
                </Markdown>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
