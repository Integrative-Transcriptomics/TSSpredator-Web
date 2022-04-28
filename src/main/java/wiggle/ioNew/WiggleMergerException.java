
package wiggle.ioNew;

/**
 * master-thesis-sfillinger
 * Description:
 *
 * @author fillinger
 * @version ${VERSION}
 *          Date: 1/21/16
 *          EMail: sven.fillinger@student.uni-tuebingen.de
 */
public class WiggleMergerException extends RuntimeException{
    public WiggleMergerException(){
        super();
    }

    public WiggleMergerException(String s){
        super(s);
    }

    public WiggleMergerException(Throwable t){
        super(t);
    }

    public WiggleMergerException(String s, Throwable t){
        super(s, t);
    }
}
