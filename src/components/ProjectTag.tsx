export type ProjectTagProps = { slug: string };

export const ProjectTag = ({ slug }: ProjectTagProps) => (
  <span className="km-proj">{slug}</span>
);

export default ProjectTag;
