import { Layout } from "antd";

const { Footer } = Layout;

export default function AppFooter() {
  return (
    <Footer className="app-footer">
      <nav className="app-footer-links" aria-label="网站备案信息">
        <a href="https://beian.miit.gov.cn/" rel="noreferrer" target="_blank">
          粤ICP备2026087046号
        </a>
        <a
          href="https://beian.mps.gov.cn/#/query/webSearch?code=44011802001573"
          rel="noreferrer"
          target="_blank"
        >
          粤公网安备44011802001573号
        </a>
      </nav>
    </Footer>
  );
}
