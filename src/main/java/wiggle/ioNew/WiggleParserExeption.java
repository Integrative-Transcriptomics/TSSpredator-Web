
package wiggle.ioNew;

/**
 * master-thesis-sfillinger
 * Description:
 *
 * @author fillinger
 * @version ${VERSION}
 *          Date: 1/19/16
 *          EMail: sven.fillinger@student.uni-tuebingen.de
 */
public class WiggleParserExeption extends RuntimeException {

    public WiggleParserExeption(){
        super();
    }

    public WiggleParserExeption(String s){
        super(s);
    }

    public WiggleParserExeption(Throwable t){
        super(t);
    }

    public WiggleParserExeption(String s, Throwable t){
        super(s, t);
    }

}
