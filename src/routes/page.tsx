import { useState, useRef } from 'react';
import { Helmet } from '@modern-js/runtime/head';
import {
  Upload,
  MessagePlugin,
  UploadFailContext,
  SuccessContext,
  Form,
  Input,
  Button,
  Space,
  Progress,
  Alert,
} from 'tdesign-react';
import { MinusCircleIcon, CloudDownloadIcon } from 'tdesign-icons-react';
import { post as fixSaveData } from '@api/pal/fix';
import type { UploadRes } from '@api/pal/upload';
import './index.css';
import 'tdesign-react/es/style/index.css';

const EXCEPT_TIME = 30;

const { FormItem, FormList } = Form;

const Index = () => {
  const [files, setFiles] = useState([]);
  const [fileUploadSuccess, setFileUploadSuccess] = useState(false);
  const [oldSaveData, setOldSaveData] = useState({
    accounts: [],
    taskName: '',
  });
  const [form] = Form.useForm();

  const onFail = (response: UploadFailContext) => {
    MessagePlugin.error(response.response.message);
  };

  const onSuccess = (response: SuccessContext) => {
    setFileUploadSuccess(true);
    const res = response.response as UploadRes;
    MessagePlugin.success(res.message);
    setOldSaveData(response.response.data);

    form.setFieldsValue({
      accounts: res.data?.accounts.map((item: string) => ({
        old_uid: item,
        new_uid: '',
      })),
    });
  };

  const resetAccounts = () => {
    form.setFieldsValue({
      accounts: oldSaveData.accounts.map((item: string) => ({
        old_uid: item,
        new_uid: '',
      })),
    });
  };

  const [loading, setLoading] = useState(false);
  const loadInterval = useRef<NodeJS.Timeout>();
  const [loadtime, setLoadtime] = useState(0);
  const [fixedFile, setFixedFile] = useState('');
  async function onSubmit() {
    const pass = await form.validate();
    if (pass === true) {
      setLoading(true);
      setLoadtime(0);
      loadInterval.current = setInterval(() => {
        setLoadtime(perv => perv + 1);
      }, 1000);
      try {
        const allFields = form.getFieldsValue(true);
        const res = await fixSaveData({
          data: {
            accounts: allFields.accounts,
            taskName: oldSaveData.taskName,
          },
        });
        setFixedFile(res.fileName);
      } catch (e) {
      } finally {
        setLoading(false);
        clearTimeout(loadInterval.current);
      }
    } else {
      MessagePlugin.error('请填写所有服务端uid，或移除不需要的uid');
    }
  }

  const download = () => {
    window.open(`/download/${fixedFile}`);
  };

  return (
    <div className="container-box">
      <Helmet>
        <link
          rel="icon"
          type="image/x-icon"
          href="https://lf3-static.bytednsdoc.com/obj/eden-cn/uhbfnupenuhf/favicon.ico"
        />
      </Helmet>
      <main>
        {fileUploadSuccess ? (
          <Form form={form} onSubmit={onSubmit}>
            <FormList name="accounts">
              {(fields, { remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }, index) => (
                    <FormItem key={key}>
                      <FormItem
                        {...restField}
                        name={[name, 'old_uid']}
                        label={`本地uid ${index}`}
                        rules={[{ required: true, type: 'error' }]}
                      >
                        <Input style={{ width: 300 }} disabled />
                      </FormItem>
                      <FormItem
                        {...restField}
                        name={[name, 'new_uid']}
                        label={`服务器uid ${index}`}
                        rules={[
                          { required: true, type: 'error' },
                          {
                            type: 'error',
                            len: 32,
                            message: '存档uid长度为32位',
                          },
                        ]}
                      >
                        <Input style={{ width: 300 }} />
                      </FormItem>

                      <FormItem>
                        {!loading && (
                          <MinusCircleIcon
                            size="20px"
                            style={{ cursor: 'pointer' }}
                            onClick={() => remove(name)}
                          />
                        )}
                      </FormItem>
                    </FormItem>
                  ))}
                  <FormItem style={{ marginLeft: 100 }}>
                    {/* <Button
                    theme="default"
                    variant="dashed"
                    onClick={() => add({ province: 'bj', area: 'tzmax' })}
                  >
                    Add field
                  </Button> */}
                  </FormItem>
                </>
              )}
            </FormList>

            <FormItem style={{ marginLeft: 100 }}>
              {/* 20秒一个 */}
              <Button type="submit" theme="primary" loading={loading}>
                提交
              </Button>
              <Button
                type="submit"
                theme="primary"
                onClick={resetAccounts}
                style={{ marginLeft: 12 }}
                disabled={loading}
              >
                重置
              </Button>
              {fixedFile && (
                <>
                  <Button
                    variant="outline"
                    icon={<CloudDownloadIcon />}
                    onClick={download}
                    style={{ marginLeft: 12 }}
                  >
                    下载
                  </Button>
                  <Alert
                    theme="success"
                    message="存档修改成功"
                    style={{ marginLeft: 12 }}
                  />
                </>
              )}
            </FormItem>

            {loading && (
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  请耐心等待，每个用户需要处理{EXCEPT_TIME}秒左右，已等待
                  {loadtime}
                  秒，
                  <span style={{ color: 'red' }}>
                    加载完成前切勿关闭页面或刷新
                  </span>
                </div>
                <Progress
                  theme="plump"
                  percentage={
                    (loadtime / (oldSaveData.accounts.length * EXCEPT_TIME)) *
                      100 >=
                    100
                      ? 99
                      : Number(
                          (
                            (loadtime /
                              (oldSaveData.accounts.length * EXCEPT_TIME)) *
                            100
                          ).toFixed(2),
                        )
                  }
                />
              </Space>
            )}
          </Form>
        ) : (
          <Upload
            theme="file"
            autoUpload
            draggable
            action="./api/pal/upload"
            files={files}
            onChange={setFiles}
            onFail={onFail}
            onSuccess={onSuccess}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
