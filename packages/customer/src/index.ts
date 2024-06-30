import {
  BasePluginType,
  BrowserBreadcrumbTypes,
  CustomerOptionType,
  CustomerTypes,
  EventTypes,
  IAnyMsgType,
  ReportDataType,
  StoreType
} from '@heimdallr-sdk/types';
import { generateUUID, getCookie, getStore, getDeepPropByDot } from '@heimdallr-sdk/utils';

export interface CustomerOptions {
  customers?: CustomerOptionType[];
}

function customerPlugin(options: CustomerOptions = {}): BasePluginType {
  const { customers = [] } = options;
  return {
    name: 'customerPlugin',
    monitor(notify: (collecteData: IAnyMsgType) => void) {
      window.addEventListener('load', function () {
        // window挂载上报方法
        window['HEIMDALLR_REPORT'] = function (type: string, data: any) {
          notify({
            st: type,
            data
          });
        };
        // 自动上报
        if (!customers.length) {
          return;
        }
        const customerData = {};
        customers.forEach((ele: CustomerOptionType) => {
          const { name, postion } = ele;
          switch (postion) {
            case StoreType.LOCAL:
            case StoreType.SESSION:
              customerData[name] = getStore(postion, name);
              break;
            case StoreType.COOKIE:
              customerData[name] = getCookie(name);
              break;
            case StoreType.GLOBAL:
              customerData[name] = getDeepPropByDot(name, window);
              break;

            default:
              break;
          }
        });
        notify({
          st: CustomerTypes.CUSTOMER,
          ...customerData
        });
      });
    },
    transform(collectedData: IAnyMsgType): ReportDataType<IAnyMsgType> {
      const lid = generateUUID();
      // 添加用户行为栈
      const breadData = { ...collectedData };
      delete breadData.sub_type;
      this.breadcrumb.unshift({
        lid,
        bt: BrowserBreadcrumbTypes.CUSTOMER,
        msg: `User report "${JSON.stringify(collectedData)}"`,
        t: this.getTime()
      });
      return {
        lid,
        t: this.getTime(),
        e: EventTypes.CUSTOMER,
        dat: collectedData
      };
    }
  };
}

export default customerPlugin;
