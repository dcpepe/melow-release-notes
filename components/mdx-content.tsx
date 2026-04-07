import { MDXRemote } from "next-mdx-remote/rsc";
import Video from "./video";
import Gif from "./gif";
import Screenshot from "./screenshot";

const components = {
  Video,
  Gif,
  Screenshot,
};

export default function MDXContent({ source }: { source: string }) {
  return <MDXRemote source={source} components={components} />;
}
