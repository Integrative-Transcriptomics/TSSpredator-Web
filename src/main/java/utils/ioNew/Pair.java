
package utils.ioNew;

/**
 * master-thesis-sfillinger
 * Description:
 *
 * @author fillinger
 * @version ${VERSION}
 *          Date: 1/25/16
 *          EMail: sven.fillinger@student.uni-tuebingen.de
 */
public class Pair <K,V> implements Comparable<Pair>{

    private K key;

    private V value;

    public Pair(K key, V value){
        this.key = key;
        this.value = value;
    }

    public K getKey(){
        return this.key;
    }

    public V getValue(){
        return this.value;
    }

    @Override
    public int compareTo(Pair o) {
        if(this.key.equals(o.getKey()) && this.value.equals(o.getValue())){
            return 0;
        } else{
            return -1;
        }
    }

    public String toString(){
        return this.key+"="+this.value;
    }

    @Override
    public boolean equals(Object o){
        if (this == o) return true;
        if (o instanceof Pair) {
            Pair pair = (Pair) o;
            if (key != null ? !key.equals(pair.key) : pair.key != null) return false;
            if (value != null ? !value.equals(pair.value) : pair.value != null) return false;
            return true;
        }
        return false;
    }
}
